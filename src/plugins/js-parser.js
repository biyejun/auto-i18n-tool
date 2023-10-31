const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { hasChinese } = require('./utils')

const i18nCollector = ({ code, type, skipWords = [] }) => {
  let isObject = false
  try {
    if (JSON.stringify(code) && code[0] === '{' && code[code.length - 1] === '}') {
      code = `(${code})`
      isObject = true
    }
  } catch (error) {
    // console.log(error);
  }
  const ast = parser.parse(code, {
    range: true,
    sourceType: 'module'
  })
  const nodeList = []
  let haveImportI18n = type == 'block'
  let needImportI18n = false
  traverse(ast, {
    enter(path) {
      if (path.isIdentifier({ name: '$t' })) {
        path.stop()
      }
      if (path.isImportDeclaration() && path.node.source.value === 'i18next') {
        haveImportI18n = true
      }
      if (path.isStringLiteral() || path.isDirectiveLiteral() || path.isTemplateElement()) {
        const node = path.node
        let start = node.start
        let end = node.end
        if (isObject) {
          start--
          end--
        }
        nodeList.push({
          type: node.type,
          start,
          end
        })
      }
    }
  })
  if (isObject) {
    code = code.slice(1, -1)
  }
  let transformedContent = ''
  let transformedString = ''
  const originStringList = []
  nodeList
    .sort((a, b) => a.start - b.start)
    .map((node, i) => {
      let originString = code.slice(node.start, node.end)
      const with$t = code.slice(node.start - 3, node.end + 1)
      if (
        hasChinese(originString)
        && with$t !== `$t(${originString})`
        && !skipWords.includes(originString.replace(/'|`|"/g, ''))
      ) {
        if (node.type === 'TemplateElement') {
          transformedString = `\${$t('${originString}')}`
          originStringList.push(originString)
        } else {
          originString = originString.replace(/'/g, '')
          transformedString = `$t('${originString}')`
          originStringList.push(originString)
        }
      } else {
        transformedString = originString
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

  if (!haveImportI18n && needImportI18n) {
    const importI18n = `\nimport i18next from 'i18next';\nconst $t = i18next.t;\n`
    transformedContent = importI18n + transformedContent
  }

  return [transformedContent, originStringList]
}

module.exports = i18nCollector
