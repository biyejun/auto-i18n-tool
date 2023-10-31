const fs = require('fs')
const path = require('path')

class Content {
  _path = ''
  constructor(path) {
    this._path = path
    console.log('已替换文件:', path);
  }

  get content() {
    return fs.readFileSync(this._path, 'utf8')
  }

  set content(data) {
    fs.writeFileSync(this._path, data)
  }

  get ext() {
    return path.extname(this._path).slice(1)
  }

  get path() {
    return this._path
  }
}

module.exports = Content