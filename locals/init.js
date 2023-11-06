const I18nTool = require('auto-i18n-tool')

const tool = new I18nTool({
  basePath: './sample',
  filePaths: [
    // 'src/components',
    // 'src/pages/common',
    // 'src/pages/employee',
    // 'src/pages/manage',
    // 'src/page/',
    // 'src/stores/',
    // 'src/utils',
    // 'src/core',
    'sample/test.ts'
  ],
  skipFiles: [
    // '.d.ts',
    // 'app.config.ts',
    // 'src/pages/common/asset/components/manage-popup', // template中有ts，暂不支持
    // 'src/pages/common/login/components/agree.vue' // template中有ts，暂不支持
  ],
  keyReplace: {
    'sample/': ''
  },
  dictPath: './locals',
  langPath: './locals',
  from: 'zh-cn',
  to: 'en-us',
})

tool.start()