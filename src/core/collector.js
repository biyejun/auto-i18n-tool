const Complier = require('./complier')
const { array2Record } = require('../utils/common')

class Collector {
  _content = ''
  _settings = {}
  constructor({ content = '', ext, skipWords }) {
    // 为不同格式的文件匹配不同的编译器
    const file = Complier[ext]({ content, skipWords })

    this._content = file.content
    this._settings = array2Record(file.i18nList)
  }
  
  get settings() {
    return this._settings
  }

  get content() {
    return this._content
  }
}

module.exports = Collector
