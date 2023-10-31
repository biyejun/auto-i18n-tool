const fs = require('fs')

class Local {
  lang
  constructor({ langPath, lang = 'en-us' }) {
    this.langPath = langPath
    this.lang = lang
  }

  get settings() {
    return this.readJsonFile('settings')
  }

  set settings(data) {
    fs.writeFileSync(`${this.langPath}/settings.json`, JSON.stringify(data, null, '\t'))
  }

  get langRecord() {
    return this.readJsonFile(this.lang)
  }

  set langRecord(data) {
    fs.writeFileSync(`${this.langPath}/${this.lang}.json`, JSON.stringify(data, null, '\t'))
  }

  get zhRecord() {
    return this.readJsonFile('zh-cn')
  }

  set zhRecord(data) {
    fs.writeFileSync(`${this.langPath}/zh-cn.json`, JSON.stringify(data, null, '\t'))
  }

  readJsonFile = name => {
    let dictData
    try {
      dictData = JSON.parse(fs.readFileSync(`${this.langPath}/${name}.json`, 'utf8'))
    } catch (e) {
      dictData = {}
    }
    return dictData
  }

  update(settings) {
    const localSettings = this.settings
    const zhRecord = this.zhRecord
    const langRecord = this.langRecord
    const waitSettings = {}

    Object.keys(localSettings).forEach(key => {
      zhRecord[key] = key
      langRecord[key] = localSettings[key] || langRecord[key]
      if (!localSettings[key]) {
        waitSettings[key] = ''
      }
    })

    Object.keys(settings).forEach(key => {
      if (!zhRecord[key] || !langRecord[key]) {
        waitSettings[key] = ''
      }
    })

    this.zhRecord = zhRecord
    this.langRecord = langRecord
    this.settings = waitSettings
  }
}

module.exports = Local