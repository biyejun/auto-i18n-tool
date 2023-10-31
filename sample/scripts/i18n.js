const AutoI18n = require('../../src')

const tool = new AutoI18n({
  basePath: './src',
  filePaths: [
    // 'src/main.js'
    'src/my.vue'
    // 'src/test'
    // 'src/App.vue'
  ],
  skipFiles: [
  ],
  skipWords: [
    '(你好)'
  ],
  keyReplace: {
    'src/': ''
  },
  dictPath: './locals',
  langPath: './locals',
  from: 'zh-cn',
  to: 'en-us',
})

tool.start()
