const parse5 = require('parse5')
// const { parse } = require('@vue/compiler-dom')
const he = require('he')
const { parseText } = require('../utils/parseText')
const { parseFilters } = require('../utils/parseFilters')
const dirRE = /^v-|^@|^:/
const vuejsi18n = require('./js-parser')
const { hasChinese } = require('./utils')

const i18nCollector = ({ code, type, skipWords = [] }) => {
  const ast = parse5.parse(code, {
    sourceCodeLocationInfo: true
  })

  let nodeList = []
  const originStringList = []
  let transformedContent = ''
  visit(ast, nodeList) // 获取属性ast
  nodeList = filterNodeList(nodeList)
  nodeList
    .sort((before, after) => before.start - after.start)
    .map((node, i) => {
      let originString = code.slice(node.start, node.end)
      let transformedString = ''
      if (node.type === 'text') {
        const hasToken = !!parseText(originString)
        if (hasToken) {
          const { tokens } = parseText(originString)
          tokens.map((token, i) => {
            let tokenTransformed = ''
            if (token.type === 'static') {
              token.binding = token.binding.replace(/^\s{1,}/g, '')
              token.start = token.end - token.binding.length
              token.binding = token.binding.replace(/\s{1,}$/g, '')
              token.end = token.start + token.binding.length
              if (isEmpty(token.binding) || !hasChinese(token.binding) || skipWords.includes(originString.replace(/'|`|"/g, ''))) {
                tokenTransformed = token.binding
              } else {
                tokenTransformed = `{{ $t('${token.binding}') }}`
                originStringList.push(token.binding)
              }
            } else {
              tokenTransformed = originString
                .slice(token.start, token.end)
                .replace(token.binding, vuejsi18n({ code: token.binding, type: 'block', skipWords })[0])
            }
            const preToken = tokens[i - 1] || {
              end: 0
            }
            transformedString += `${originString.slice(preToken.end, token.start)}${tokenTransformed}`
            if (i === tokens.length - 1) {
              transformedString += originString.slice(token.end)
            }
          })
        } else {
          if (hasChinese(originString) && !skipWords.includes(originString.replace(/'|`|"/g, ''))) {
            originString = originString.replace(/^\s{1,}/g, '')
            node.start = node.end - originString.length
            originString = originString.replace(/\s{1,}$/g, '')
            node.end = node.start + originString.length
            transformedString = `{{ $t('${originString}') }}`
            originStringList.push(originString)
          } else {
            transformedString = originString
          }
        }
      }
      if (node.type === 'directive') {
        const value = parseFilters(originString.slice(originString.indexOf('=') + 2, -1))
        const collector = vuejsi18n({ code: value, type: 'block' })
        transformedString = originString.replace(value, collector[0])
        originStringList.push(...collector[1])
      }
      if (node.type === 'attr') {
        const value = originString.slice(originString.indexOf('=') + 2, -1)
        if (hasChinese(value) && !skipWords.includes(originString.replace(/'|`|"/g, ''))) {
          transformedString = `:${originString.replace(value, `$t('${value}')`)}`
          originStringList.push(value)
        } else {
          transformedString = originString
        }
      }
      const preNode = nodeList[i - 1] || {
        end: 0
      }
      transformedContent += `${code.slice(preNode.end, node.start)}${transformedString}`
      if (i === nodeList.length - 1) {
        transformedContent += code.slice(node.end)
      }
    })
  transformedContent = transformedContent || code

  return [transformedContent, originStringList]
}

function isEmpty(value) {
  return !he.decode(value).trim()
}

function visit(ast, nodeList) {
  ast.attrs && ast.sourceCodeLocation && ast.sourceCodeLocation.attrs &&
    ast.attrs.map(attr => {
      if (isEmpty(attr.value) || vueDirectiveIgnore(attr.name)) {
        return
      }
      const type = dirRE.test(attr.name) ? 'directive' : 'attr'
      let attrIndex = attr.name

      // deal template like this <use xlink: href="中文"></use>
      if (attr.prefix) {
        attrIndex = attr.prefix + ':' + attrIndex
      }
      nodeList.push({
        start: ast.sourceCodeLocation.attrs[attrIndex].startOffset,
        end: ast.sourceCodeLocation.attrs[attrIndex].endOffset,
        type
      })
    })
  if (ast.nodeName === '#text' && ast.sourceCodeLocation) {
    if (isEmpty(ast.value)) {
      return
    }
    nodeList.push({
      start: ast.sourceCodeLocation.startOffset,
      end: ast.sourceCodeLocation.endOffset,
      type: 'text'
    })
  }
  ast.childNodes &&
    ast.childNodes.map(childNode => {
      visit(childNode, nodeList)
    })
  ast.content &&
    ast.content.childNodes.map(childNode => {
      visit(childNode, nodeList)
    })
}

function filterNodeList(nodeList) {
  const list = []
  const unique = new Set()
  nodeList.forEach((item, index) => {
    const num = `${item.start}-${item.end}`

    if (!unique.has(num)) list.push(item)
    unique.add(num)
  })
  return list
}

function vueDirectiveIgnore(str = '') {
  if ([':href', 'href', ':src', 'src'].includes(str)) {
    return true
  }
  return false
}

module.exports = i18nCollector
