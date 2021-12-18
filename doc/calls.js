import { jsPDF } from 'jspdf'
import * as pdf from './pdf-lib.js'
import * as utils from '../lib/utils.js'
import * as constant from '../lib/constant.js'
import { Pager } from './pager.js'

/*
const ICall = {
  date: '', // дата звонка (2021-11-09 13:01)
  abonent: '', // номер абонента полный (74956261322)
  abonent2: '', // номер абонента краткий (6261322)
  number: '', // вызываемый (целевой) номер (88617648339)
  code: '', // телефонный код направления (7861)
  traf: '', // тип трафика (MG,MN)
  stat: '', // тип трафика детально (MWSZ)
  sec: 0, // продолжительность, секунд
  min: 0, // продолжительность, минут
  tid: 0, // тарифный план
  sum: 0, // сумма за разговор
  target: '', // цель звонка (г. Москва и Московская область)
  direction: '', // обобщённая цель (Внутризоновая)
}
*/

/**
 * Создание Позвонковой детализации
 * @param {array} data - массив объектов с данными (ICall - см. types.js)
 * @param {string} nameFile - имя файла для результата
 * @param {string} period - период (2021_12)
 * @param {string} cusType - тип клиента (u|f)
 * @param {string} custName - имя клиента
 * @param {number} custId - код клиента (custonerId for cusType=u; personalId for cusType=f)
 * @param {string} custAddress - адрес клиента (need only for cusType=f)
 * @return {*} создаёт файл `nameFile`.pdf
 */
export const createCalls = ({ data, nameFile, period, custType, custName, custId, custAddress }) => {
  const [xb, yb] = [15, 15] // точка отсчёта
  const tab = {
    titles: { MG: 'междугородняя/международная связь', VZ: 'внутризоновая связь' },
    width: 154, // ширина
    height: 270, // высота
    dy2: 8, // смещение для разделов
    // поля:
    abonent: { name: 'Абонент', w: 20, x: 0, isShort: true },
    date: { name: 'Дата', w: 22, x: 20, isDate: true },
    number: { name: 'Номер', w: 28, x: 42 },
    code: { name: 'Код', w: 18, x: 70 },
    target: { name: 'Направление', w: 36, x: 88, isCrop: true },
    min: { name: 'Мин', w: 8, x: 124, isRight: true },
    sum: { name: 'Сумма', w: 22, x: 132, isRight: true, isCurrency: true },
    // колонки (названия из data)
    fields: ['abonent', 'date', 'number', 'code', 'target', 'min', 'sum'],
  }
  const grey = [214, 214, 214]

  // поля группировки
  const group = {
    traffic: { current: '', calls: 0, min: 0, sum: 0 },
    abonent: { current: '', calls: 0, min: 0, sum: 0 },
    total: { current: '', calls: 0, min: 0, sum: 0 },
    addTraffic(data) {
      this._add(data, 'traffic')
    },
    addAbonent(data) {
      this._add(data, 'abonent')
    },
    addTotal(data) {
      this._add(data, 'total')
    },
    resetTraffic() {
      this._reset('traffic')
    },
    resetAbonent() {
      this._reset('abonent')
    },
    resetTotal() {
      this._reset('total')
    },
    _add(data, item) {
      this[item].current = data[item]
      this[item].calls += 1
      this[item].min += data.min
      this[item].sum += data.sum
    },
    _reset(item) {
      this[item].current = ''
      this[item].calls = 0
      this[item].min = 0
      this[item].sum = 0
    },
  }

  console.log(nameFile)

  const doc = new jsPDF({ putOnlyUsedFonts: true })
  const bold = 'PT_Sans-Web-Bold'
  const regular = 'PT_Sans-Web-Regular'
  doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', regular, 'normal')
  doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', bold, 'normal')
  doc.setFont(regular)

  const pager = new Pager({ heightPage: tab.height, startY: yb, stepY: 4 })
  pager.on('newpage', () => {
    printFooter({ doc, x: xb, y: yb + tab.height, widthPage: tab.width, page: pager.page - 1, color: grey })

    doc.addPage()

    printHeaderColumns({ doc, tab, fields: tab.fields, x: xb, y: pager.y, fontName: bold })
    pager.next(2)

    pdf.printLine({ doc, x: xb, y: pager.y, width: tab.width, widthLine: 0.5, color: grey })

    pager.next()
    doc.setFont(regular)
  })

  /// (1) Header
  const [header, heightHeader] = getHeader({ doc, period, custType, custName, custId, custAddress, fontSize: 10 })
  pdf.printText({ doc, text: header, x: xb, y: pager.y, fontSize: 10 })

  pager.next(heightHeader + 7)

  /// (2) Названия колонок
  printHeaderColumns({ doc, tab, fields: tab.fields, x: xb, y: pager.y, fontName: bold })

  doc.setFont(regular)

  pager.next(2)
  /// (2a) Линия под названиями колонок
  pdf.printLine({ doc, x: xb, y: pager.y, width: tab.width, widthLine: 0.5, color: grey })

  pager.next(4)

  /// (3) Вызовы
  data.forEach((d, index) => {
    // итоги по абонентскому номеру
    if (
      index > 0 &&
      (group.abonent.current != d.abonent || (group.abonent.current == d.abonent && group.traffic.current != d.traffic))
    ) {
      printResumeAbonent({ doc, tab, group, x: xb, y: pager.y })
      pager.next(tab.dy2)
    }

    // итоги по трафику (МГ | ВЗ)
    if (group.traffic.current != d.traffic && index > 0) {
      printResumeTraffic({ doc, tab, group, x: xb, y: pager.y })
      pager.next()
    }

    // заголовки МГ / ВЗ
    if (group.traffic.current != d.traffic) {
      pager.next(2)
      pdf.printText({ doc, text: tab.titles[d.traffic], x: xb, y: pager.y, fontSize: 9, fontName: bold })
      group.resetTraffic()
      pager.next()
      doc.setFont(regular)
    }

    // инфо по одному вызову
    printOneCall({ doc, data: d, tab, fields: tab.fields, x: xb, y: pager.y })
    pager.next()
    group.addTraffic(d)
    group.addAbonent(d)
    group.addTotal(d)
  })

  if (group.abonent.current) {
    printResumeAbonent({ doc, tab, group, x: xb, y: pager.y })
    pager.next(tab.dy2)
  }
  if (group.traffic.current) {
    printResumeTraffic({ doc, tab, group, x: xb, y: pager.y })
    pager.next(tab.dy2)
  }
  if (group.total.sum) {
    pdf.printLine({ doc, x: xb, y: pager.y, width: tab.width, widthLine: 0.5, color: grey })
    pager.next(4)
    printResumeTotal({ doc, tab, group, x: xb, y: pager.y })
    pager.next(tab.dy2)
  }

  // printLastBlock({ doc, x: xb, y: pager.y })

  printFooter({ doc, x: xb, y: yb + tab.height, widthPage: tab.width, page: pager.page, color: grey })

  doc.save(nameFile)
}

// -----------------------------------------------------------------
/// (4) функции
const getHeader = ({ doc, period, custType, custName, custId, custAddress, fontSize }) => {
  const header = []
  const [year, month] = period.split('_') // 2021_12
  let monthText = constant.MonthDigitToNameMap[Number(month)]
  monthText = monthText.slice(0, 1).toUpperCase() + monthText.slice(1)

  let customer = `${custName} (id=${custId})`
  let ndsAbout = `(стоимость без НДС)`

  if (custType === 'f') {
    customer += `, ${custAddress}`
    ndsAbout = ''
  }
  header.push(`${customer}`)
  header.push(`Расшифровка за цифровой канал связи(соединения по межгороду)`)
  header.push(`${monthText} ${year}г ${ndsAbout}`)

  const height = pdf.getHeightInMm({ doc, rows: 3, fontSize })

  return [header.join('\n'), height]
}

const printResumeAbonent = ({ doc, tab, group, x, y }) => {
  const fontSize = 8
  // const abonentTotal = `тел: ${createShort(group.abonent.current)}, всего разговоров: ${group.abonent.calls}`
  // pdf.printText({ doc, text: abonentTotal, x, y, fontSize })
  const [dt, dd] = [2, 1]
  pdf.printLine({ doc, x: x + tab.min.x, y: y - dt, width: 30, widthLine: 0.1, color: [124, 124, 124] })
  pdf.printLeft({ doc, str: String(group.abonent.min), x: x + tab.min.x + tab.min.w, y: y + dd, fontSize })
  pdf.printLeft({ doc, str: getTextCost(group.abonent.sum), x: x + tab.sum.x + tab.sum.w, y: y + dd, fontSize })

  group.resetAbonent()
}

const printResumeTraffic = ({ doc, tab, group, x, y, xb = 15 }) => {
  const fontSize = 8
  const text = `всего (${tab.titles[group.traffic.current]})`
  const [dt, dd, wtext] = [2, 1, doc.getTextWidth(text) + 3]
  const xLineStart = xb + tab.target.x + tab.target.w - wtext
  const xLineEnd = xb + tab.width
  const width = xLineEnd - xLineStart

  pdf.printLine({ doc, x: xLineStart, y: y - dt, width, widthLine: 0.1, color: [124, 124, 124] })

  pdf.printLeft({ doc, str: text, x: x + tab.target.x + tab.target.w, y: y + dd, fontSize })
  pdf.printLeft({ doc, str: String(group.traffic.min), x: x + tab.min.x + tab.min.w, y: y + dd, fontSize })
  pdf.printLeft({ doc, str: getTextCost(group.traffic.sum), x: x + tab.sum.x + tab.sum.w, y: y + dd, fontSize })

  group.resetTraffic()
}

const printResumeTotal = ({ doc, tab, group, x, y }) => {
  const fontSize = 9

  pdf.printLeft({ doc, str: 'Итого:', x: x + tab.target.x + tab.target.w, y, fontSize })
  pdf.printLeft({ doc, str: String(group.total.min), x: x + tab.min.x + tab.min.w, y, fontSize })
  pdf.printLeft({ doc, str: getTextCost(group.total.sum), x: x + tab.sum.x + tab.sum.w, y, fontSize })

  group.resetTotal()
}

const getTextCost = (sum) => {
  return `${sum.toFixed(2)} р.`
}

const printHeaderColumns = ({ doc, tab, fields, x, y, fontName }) => {
  const fontSize = 9
  fields.forEach((field) => {
    const f = tab[field]

    if (tab[field].isRight) {
      pdf.printLeft({ doc, str: f.name, x: x + f.x + f.w, y, fontSize, fontName })
    } else {
      pdf.printText({ doc, text: f.name, x: x + f.x, y, fontSize, fontName })
    }
  })
}

const printOneCall = ({ doc, data, tab, fields, x, y }) => {
  const fontSize = 8

  fields.forEach((field) => {
    const f = tab[field]
    let value = tab[field].isCurrency ? getTextCost(data[field]) : String(data[field])
    value = tab[field].isDate ? getDate(value) : value
    value = tab[field].isCrop ? cropString({ doc, value, widthMax: tab[field].w - 1, fontSize }) : value
    value = tab[field].isShort ? createShort(value) : value

    if (tab[field].isRight) {
      pdf.printLeft({ doc, str: value, x: x + f.x + f.w, y, fontSize })
    } else {
      pdf.printText({ doc, text: value, x: x + f.x, y, fontSize })
    }
  })
}

// сокращение номера 74951234567 -> 1234567
const createShort = (value) => {
  const re = /^(7|8)49(5|9)\d{7}$/
  return re.test(value) ? value.slice(4) : value
}

// обрезка строки, если она шире выделенной области
const cropString = ({ doc, value, widthMax, fontSize }) => {
  let str = String(value)
  doc.setFontSize(fontSize)

  let widthValue = doc.getTextWidth(value)

  if (widthValue <= widthMax) {
    return value
  }

  let i = 0
  while (widthValue > widthMax) {
    i++
    str = value.slice(0, -i)
    widthValue = doc.getTextWidth(str)
    if (i > 100) {
      break
    }
  }

  return `${str}...`
}

// 2021-11-03 12:36  -> 03-11-2021 12:36
const getDate = (date) => {
  const [dt, time] = date.split(' ') // [2021-11-03, 12:36]
  const [year, m, d] = dt.split('-') // [2021, 11, 03]
  const y = year.slice(2)
  return `${d}-${m}-${y} ${time}`
}

const printLastBlock = ({ doc, x, y }) => {
  const texts = [
    `Внимание!`,
    `С 01-04-2009 детальная расшифровка соединений МГ и МН связи будет`,
    `предоставляться ТОЛЬКО в электронном виде.`,
    `Просим сообщить ваш электронный адрес, если Вам необходима такая услуга.`,
    `тел. +7(495) 937-31-73 Трофимова Олеся Александровна`,
    `email: otrofimova@a2tele.com`,
  ]
  let offset = 0
  texts.forEach((text) => {
    pdf.printText({ doc, text, x, y: y + offset, fontSize: 8 })
    offset += 4
  })

  return y + offset // current Y
}

const printFooter = ({ doc, x, y, widthPage, page = 0, color = [0, 0, 0] }) => {
  pdf.printLine({ doc, x, y, width: widthPage, widthLine: 0.2, color })
  pdf.printLeft({ doc, str: `page ${page}`, x: x + widthPage, y: y + 3, fontSize: 7 })
}
