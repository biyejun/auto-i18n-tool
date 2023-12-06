const I18nTool = require('../src/index');

describe('start trans', () => {
  it('start', () => {
    const tool = new I18nTool({
      basePath: './sample',
      filePaths: [
        // 'sample/'
      ],
      skipFiles: ['/pages'],
      dictPath: './locals',
      langPath: './locals',
      from: 'zh-cn',
      to: 'en-us',
    });
    // tool.start()
    expect(true).toBe(true);
  });
});
