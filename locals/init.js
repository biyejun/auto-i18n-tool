const I18nTool = require('../src/index')

const tool = new I18nTool({
  basePath: './sample',
  filePaths: [
    // 'sample/'
  ],
  skipFiles: [
    '/pages'
  ],
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