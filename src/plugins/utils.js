exports.hasChinese = str => /[\u4e00-\u9fa5]/.test(str)

exports.with$t = (node, code) => {
  const with$t = code.slice(node.getStart() - 3, node.getEnd() + 1)
  return with$t === `$t(${node.getText()})`
}