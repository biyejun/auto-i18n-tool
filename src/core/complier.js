const vueCompiler = require('@vue/compiler-sfc')
const vuetemplatei18n = require('../plugins/vue-parser')
const vuejsi18n = require('../plugins/js-parser')
const vuetsi18n = require('../plugins/ts-parser')

// 需多次解析，避免错误
let parse
const compileVueMiddleware = (file) => {
  const i18nList = []
  parse = vueCompiler.parse(file.content).descriptor // @vue/compiler-sfc也提供了ast，暂时没用
  // Template
  if (parse.template) {
    const [updated, originList = []] = vuetemplatei18n({ code: parse.template.content })
    file.content = file.content.slice(0, parse.template.loc.start.offset) + updated + file.content.slice(parse.template.loc.end.offset)
    i18nList.push(...originList)
  }
  // Script
  parse = vueCompiler.parse(file.content).descriptor
  const parseScript = script => {
    if (script) {
      const [updated, originList] = (script.lang == 'ts' ? vuetsi18n : vuejsi18n)({
        code: script.content,
        type: 'setup',
        skipWords: file.skipWords
      })
      file.content = file.content.slice(0, script.loc.start.offset) + updated + file.content.slice(script.loc.end.offset)
      i18nList.push(...originList)
    }
  }
  parseScript(parse.scriptSetup)
  parseScript(parse.script)
  parse = vueCompiler.parse(file.content).descriptor
  file.i18nList = i18nList
  return file
}

const scriptMiddleware = (file, complieMethod) => {
  const i18nList = []
  const [updated, originList] = complieMethod({ code: file.content, ...file })
  file.content = updated
  i18nList.push(...originList)
  file.i18nList = i18nList
  return file
}

const Processes = {
  vue: compileVueMiddleware,
  js: param => scriptMiddleware(param, vuejsi18n),
  ts: param => scriptMiddleware(param, vuetsi18n),
}

module.exports = Processes
