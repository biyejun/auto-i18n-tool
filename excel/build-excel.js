const fs = require('fs')
const path = require('path')
const xlsx = require('node-xlsx')
const readJson = require('./en-us.json')

// console.log(readJson,'readJson');

let data = []

Object.keys(readJson).forEach(key => {
  const enStr = readJson[key]
  data.push([key, enStr])
})

const buffer = xlsx.build([{name: '翻译', data: data}]); // Returns a buffer
fs.writeFileSync('./excel/cn.xlsx', buffer, "binary");

