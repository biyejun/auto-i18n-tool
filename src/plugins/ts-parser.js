const tsParser = require('typescript')
const { hasChinese, with$t } = require('./utils')

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

  const ast = tsParser.createSourceFile('temp.ts', code, tsParser.ScriptTarget.Latest, /*setParentNodes */true)
  const nodeList = []
  let haveImportI18n = type === 'block'
  let needImportI18n = false
  let isImportFirstLine = type !== 'setup'

  const enter = (node, next = () => {}) => {
    // console.log("Kind: ", tsParser.SyntaxKind[node.kind], node.getText());
    // ignore console
    if (tsParser.isExpressionStatement(node) && node.getText().includes('console.')) {
      return;
    }
    // 是否已经引入了i18n
    if (tsParser.isImportDeclaration(node)) {
      // 第一行
      isImportFirstLine = isImportFirstLine || node.getStart() === 0
      if (node.moduleSpecifier.text === 'i18next') {
        haveImportI18n = true
      }
      return;
    }

    // 字符串 模板字符串
    if (tsParser.isStringLiteral(node) || tsParser.isTemplateExpression(node)) {
      // console.log("Kind: ", tsParser.SyntaxKind[node.kind], node.getText());

      if (with$t(node, code)) return;
      if (tsParser.isTemplateExpression(node)) {
        nodeList.push({
          type: 'TemplateExpression',
          start: node.getStart(),
          end: node.getEnd(),
          text: node.getText() // `head_${xx}_literal_${}_literal`
        })
      } else {
        let start = node.getStart()
        let end = node.getEnd()
        if (isObject) {
          start--
          end--
        }
        nodeList.push({
          type: tsParser.SyntaxKind[node.kind],
          start,
          end,
        })
      }
    }
    next()
  }

  const visit = (node) => {
    enter(node, () => tsParser.forEachChild(node, visit))
  }
  visit(ast)

  if (isObject) {
    code = code.slice(1, -1)
  }
  let transformedContent = ''
  let transformedString = ''
  const originStringList = []

  const mapList = (node, i, nodeList) => {
    let originString = code.slice(node.start, node.end)
    const with$t = code.slice(node.start - 3, node.end + 1)
    if (
      hasChinese(originString)
      && with$t !== `$t(${originString})`
      && node.type !== 'ConditionalExpression'
      && !skipWords.includes(originString.replace(/'|`|"/g, ''))
    ) {
      needImportI18n = true
      if (node.type === 'TemplateExpression') {
        const regex = /[\u4e00-\u9fa5]+/g;
        const zhArr = originString.match(regex) || [];
        zhArr.forEach(text => {
          const regex = new RegExp(`(?<!\\$\\{t\\(')${text}(?!'\\)})`, 'g');
          originString = originString.replace(regex, `\${$t('${text}')}`);
          originStringList.push(text)
        })
        transformedString = originString
      } else {
        originString = originString.replace(/'|`|"/g, '')
        transformedString = `$t('${originString}')`
        originStringList.push(originString)
      }
    } else {
      transformedString = originString
    }
    const preNode = nodeList[i - 1] || { end: 0 }
    transformedContent += `${code.slice(preNode.end, node.start)}${transformedString}`
    if (i === nodeList.length - 1) {
      transformedContent += code.slice(node.end)
    }
  }

  let prev = nodeList[0]
  nodeList.sort((a, b) => a.start - b.start).filter((x, i, arr) => {
    const leave = prev && (prev.end <= x.start && prev.end <= x.end || prev.start === x.start && prev.end === x.end)
    leave && (prev = x)
    return (!prev || leave) && (x.type === 'TemplateExpression' && x.text || x.type !== 'TemplateExpression')
  }).map(mapList)

  transformedContent = transformedContent || code

  if (!haveImportI18n && needImportI18n) {
    const importI18n = `${isImportFirstLine ? '' : '\n'}import i18next from 'i18next';\nconst $t = i18next.t;\n`
    transformedContent = importI18n + transformedContent
  }
  return [transformedContent, originStringList]
}

module.exports = i18nCollector
