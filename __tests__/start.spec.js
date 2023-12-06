const I18nTool = require('../src/index');

const conf = {
  basePath: './__tests__/sample',
  filePaths: [
    // 'sample/'
  ],
  skipFiles: ['/pages'],
  dictPath: './__tests__/locals',
  langPath: './__tests__/locals',
  from: 'zh-cn',
  to: 'en-us',
};



describe('start trans', () => {
  it('start', () => {
    const tool = new I18nTool(conf);
    tool.start()
    expect(true).toBe(true);
  });
});
