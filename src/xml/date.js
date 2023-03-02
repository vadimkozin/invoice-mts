import dayjs from 'dayjs'

const date = {
  // возвращает текущий день в формате YYYYMMDD
  getCurrentDay() {
    return dayjs().format('YYYYMMDD')
  },
  // возвращает Дату в формате dd.mm.yyyy
  getDate(date /* Date */) {
    return dayjs(date).format('DD.MM.YYYY')
  },
  // Дата формирования файла обмена в формате dd.mm.yyyy
  getDateCreateFile() {
    return dayjs().format('DD.MM.YYYY')
  },
  // Время формирования файла обмена HH.MM.SS
  getTimeCreateFile() {
    return dayjs().format('HH.mm.ss')
  },
}

export { date }
