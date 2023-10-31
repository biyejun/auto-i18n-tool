const Directory = require('./core/directory')
const Local = require('./core/local')
const Collector = require('./core/collector')

class Main {
  config = {}
  constructor(config) {
    const { basePath, filePaths, skipFiles, langPath } = config
    this.directory = new Directory({ basePath, filePaths, skipFiles })
    this.local = new Local({ langPath, lang: this.config.to })
    this.config = config
  }

  start() {
    // 所有文件列表
    const list = this.directory.list
    const settings = {}
    list.forEach(file => {
      try {
        // 为每个文件创建收集对象
        const collector = new Collector({
          content: file.content,
          ext: file.ext,
          skipWords: this.config.skipWords
        })
        // 将处理后的代码写入到原文件
        file.content = collector.content
        // 收集需要翻译的key，准备写到settings.json
        Object.assign(settings, collector.settings)
      } catch (error) {
        console.error('===文件中有无法识别内容：', file.path);
      }
    })
    // 更新settings.json文件
    this.local.update(settings)
  }
}

module.exports = Main