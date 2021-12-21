import * as constant from './constant.js'

export const addZero = (str) => String(str).padStart(2, '0') // '1' => '01'

// возвращает список кодов клиентов
export const getCustomersId = (book) => book.map((b) => b.cid)

// возвращает список кодов клиентов (физ-лица)
export const getPersonsId = (book) => book.map((b) => b.pid)

// возвращает то что набрали в командной строке
export const getCommandLine = () => process.argv.slice(2).join(' ')

// возвращает сколько раз встречается символ symb в строке
export const getCountSymbolInString = (str, symb) => {
  let count = -1
  for (let index = 0; index != -1; count++, index = str.indexOf(symb, index + 1));
  return count
}

export const date = {
  preparePeriod(period) {
    // ??_??_?? -> ??-??-??
    return ''.replaceAll('_', '-')
  },
  getYMD(date) {
    // -> YYYY-MM-DD
    return new Date(date).toISOString().split('T')[0]
  },
  getDMY(dateStr) {
    // 2021-12-31 -> 31-12-2021
    const d = dateStr.split('-')
    return `${d[2]}-${[d[1]]}-${d[0]}`
  },
  getDWY(dateStr) {
    // 2021-12-31 -> 31 декабря 2021
    const d = dateStr.split('-')
    return `${d[2]} ${constant.MonthDigitToNameCaseMap[d[1]]} ${d[0]}`
  },
  addDays(date, days) {
    // add days to date
    return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000)
  },
}
