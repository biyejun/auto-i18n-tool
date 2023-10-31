const fs = require('fs')
const path = require('path')
const Content = require('./content')
const SUPPORT_EXTS = ['.vue', '.js', '.ts']

class Directory{
  _paths = []
  _list = []
  constructor({ basePath = './', filePaths = [], skipFiles = [] }) {
    this.basePath = basePath
    this.filePaths = filePaths
    this.skipFiles = skipFiles

    this.mapDir(this.basePath)
    this.readFiles()
  }

  get list() {
    return this._list
  }

  isInList(path) {
    path = path.replace(/\\/g, '\/')
    if (this.filePaths.length) {
      return this.filePaths.some(_ => path.includes(_)) && !this.skipFiles.some(_ => path.includes(_))
    } else {
      return !this.skipFiles.some(_ => path.includes(_))
    }
  }

  mapDir(dir = this.basePath) {
    const files = fs.readdirSync(dir)
    files.forEach(filename => {
      const pathname = path.join(dir, filename)
      const stats = fs.statSync(pathname)
      if (stats.isDirectory()) {
        this.mapDir(pathname)
        return;
      }
      if (stats.isFile() && this.isInList(pathname) && SUPPORT_EXTS.includes(path.extname(pathname))) {
        this._paths.push(pathname)
      }
    })
  }

  readFiles() {
    this._list = this._paths.map(path => new Content(path))
  }
}

module.exports = Directory