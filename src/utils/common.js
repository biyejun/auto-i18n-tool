function array2Record(arr) {
  const record = {}
  arr.forEach((item) => {
    record[item] = ''
  })
  return record
}

exports.array2Record = array2Record
