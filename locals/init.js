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

/* 
提示语句实例：

请在""中填充英文翻译，返回给我JSON
	"物料编码": "",
	"物料名称": "",
	"当前库存": "",
	"出库数量": "",
	"出库物料备注": "",

*/