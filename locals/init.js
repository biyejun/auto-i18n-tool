const I18nTool = require('auto-i18n-tool')

const tool = new I18nTool({
  basePath: './sample',
  filePaths: [
    'sample/'
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