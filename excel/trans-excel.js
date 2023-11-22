const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');

const excelFilePath = path.resolve(__dirname, './cn-1.xlsx');

//解析excel, 获取到所有sheets
const sheets = xlsx.parse(excelFilePath);

// 查看页面数
console.log(sheets.length);

// 打印页面信息..
const sheet = sheets[0];
// console.log(sheet);

// 打印页面数据
// console.log(sheet.data);

let result = {}
// 输出每行内容
sheet.data.forEach(([key, value]) => {
  result[key] = value
});

fs.writeFileSync('./excel/en-us2.json', JSON.stringify(result, null , '\t'), 'utf-8')
