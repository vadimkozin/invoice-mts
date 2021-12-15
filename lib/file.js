import path from 'node:path'
import fs from 'fs-extra'
import csv from '@fast-csv/format'

/**
 * Запись в файл в csv-формате
 * @param {string} file имя файла
 * @param {array} data массив объектов с данными
 * @return {number} количество записей
 */
export const writeFile = ({ file, data }) => {
  let count = 0

  fs.ensureDirSync(path.dirname(file))

  const stream = csv.format({ delimiter: ';', headers: true })
  const writeStream = fs.createWriteStream(file)

  stream.pipe(writeStream)

  data.forEach((d) => {
    stream.write(d)
    count++
  })

  stream.end()

  return count
}
