import { jsPDF } from 'jspdf'
import * as pdf from './pdf-lib.js'
import * as utils from '../utils.js'
import * as constant from '../constant.js'

/**
 * Создание Извещения (для физ-лиц)
 * @param {object} data - объект с данными (INotice - см. types.js) для формируемого извещения
 * @param {string} nameFile - имя файла для результата
 */
export const createNotice = (data, nameFile) => {
  const [xb, yb] = [15, 15] // точка отсчёта
  const blank = {
    width: 135, // ширина документа
    height: 125, // высота
    rows: [55, 70],
    cols: [38, 97],
  }

  console.log(nameFile)

  const doc = new jsPDF({ putOnlyUsedFonts: true })
  doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', 'PT_Sans-Web-Regular', 'normal')
  doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', 'PT_Sans-Web-Bold', 'normal')
  doc.setFont('PT_Sans-Web-Regular')

  doc.setLineWidth(0.5)
  doc.rect(xb, yb, blank.width, blank.height)

  drawOutline(xb, yb, doc, blank)

  // hor-lines
  let offset = 0
  blank.rows.forEach((h) => {
    offset += h
    doc.line(xb, yb + offset, xb + blank.width, yb + offset)
  })

  // ver-lines
  offset = 0
  blank.cols.forEach((w) => {
    offset += w
    doc.line(xb + offset, yb, xb + offset, yb + blank.height)
  })

  /// (1) Header
  const x = xb + blank.cols[0]
  const width = blank.cols[1]
  offset = 5

  const headers = getHeader(data.operator)
  headers.forEach((h) => {
    pdf.printCenter({ doc, str: h, x, y: yb + offset, width, fontSize: 9 })
    offset += 4
  })

  offset += 4
  pdf.printCenter({ doc, str: `ИЗВЕЩЕНИЕ ${data.document.number}`, x, y: yb + offset, width, fontSize: 10 })

  doc.setFontSize(9)
  offset += 5
  pdf.printText({ doc, text: 'Об оплате услуг междугородной телефонной связи', x: x + 2, y: yb + offset, fontSize: 9 })

  offset += 4
  pdf.printText({ doc, text: getSumma(data.document), x: x + 2, y: yb + offset, fontSize: 9 })

  offset += 4
  pdf.printText({ doc, text: getPayer(data.person), x: x + 2, y: yb + offset, fontSize: 9 })

  const { text: address, rows } = pdf.prepareLongString({
    doc,
    str: getAddress(data.person),
    widthMax: blank.cols[1] - 4,
    fontSize: 9,
  })
  offset += 4
  pdf.printText({ doc, text: address, x: x + 2, y: yb + offset, fontSize: 9 })

  /// (2) Body
  let y = xb + blank.rows[0]
  offset = 5
  pdf.printText({ doc, text: getData(data.document), x: x + 2, y: y + offset, fontSize: 9 })
  pdf.printLeft({ doc, str: getPhone(), x: xb + blank.cols[0] + blank.cols[1], y: y + offset, fontSize: 9 })

  offset += 10
  pdf.printText({ doc, text: getPayer(data.person), x: x + 2, y: y + offset, fontSize: 9 })

  offset += 5
  pdf.printText({ doc, text: address, x: x + 2, y: y + offset, fontSize: 9 })
  const heightRows = pdf.getHeightInMm({ doc, rows, fontSize: 9 })

  offset += heightRows + 2

  const tab = {
    x: x + 2, // x - top left
    y: y + offset, // y - top left
    width: blank.cols[1] - 4,
    height: 5,
    cols: [75, 20], // width columns
    dx: 2,
  }

  doc.setLineWidth(0.2)
  doc.rect(tab.x, tab.y, tab.width, tab.height)
  doc.line(tab.x + tab.cols[0] - tab.dx, tab.y, tab.x + tab.cols[0] - tab.dx, tab.y + tab.height)
  pdf.printCenter({ doc, str: 'Вид услуги', x: tab.x, y: tab.y + 3.5, width: tab.cols[0], fontSize: 8 })

  pdf.printCenter({
    doc,
    str: 'Стоимость',
    x: tab.x + tab.cols[0] - tab.dx,
    y: tab.y + 3.5,
    width: tab.cols[1],
    fontSize: 8,
  })

  pdf.printText({
    doc,
    text: getTextService(data.document.period),
    x: tab.x + tab.dx,
    y: tab.y + tab.height + 5,
    fontSize: 9,
  })

  pdf.printLeft({
    doc,
    str: gerTextCost(data.document),
    x: tab.x + tab.width,
    y: tab.y + tab.height + 5,
    fontSize: 9,
  })

  /// (2) Footer
  const footer = {
    x: xb + 2,
    y: yb + blank.height,
    x2: xb + blank.cols[0] + 2,
    x3: xb + blank.cols[0] + tab.cols[0],
    dy: 4,
  }

  pdf.printText({
    doc,
    text: resume.note(data.document, data.person),
    x: footer.x,
    y: footer.y + footer.dy,
    fontSize: 8,
  })

  pdf.printText({ doc, text: resume.payBefore(data.document), x: footer.x2, y: footer.y + footer.dy, fontSize: 9 })

  doc.setFont('PT_Sans-Web-Bold')
  pdf.printLeft({ doc, str: 'ИТОГО:', x: footer.x3, y: footer.y + footer.dy, fontSize: 9 })
  pdf.printLeft({ doc, str: gerTextCost(data.document), x: tab.x + tab.width, y: footer.y + footer.dy, fontSize: 9 })

  doc.save(nameFile)
}

const getHeader = (operator) => {
  const result = []
  result.push(operator.name)
  result.push(`ИНН/КПП  ${operator.inn}/${operator.kpp}`)
  result.push(`Р/сч ${operator.account}`)
  result.push(`${operator.bank} ${operator.citybank}`)
  result.push(`К/сч ${operator.kaccount}, БИК ${operator.bik}`)
  return result
}

const getSumma = (document) => {
  return `${utils.date.getDMY(document.date)}    Сумма:  ${document.sum.toFixed(2)}р.`
}

const getPayer = (person) => {
  return `Плательщик:  ${person.name},  телефон: ${person.phone}`
}

const getAddress = (person) => {
  return `Адрес:  ${person.address}`
}

const getData = (document) => {
  return `${utils.date.getDMY(document.date)}`
}

const getPhone = () => {
  return `Тел для справок: ${constant.docum.phone}`
}

const getTextService = (period) => {
  return `Переговоры за ${constant.MonthDigitToNameMap[period.month]} ${period.year} г.`
}

const gerTextCost = (document) => {
  return `${document.sum.toFixed(2)} р.`
}

// итоги под бланком
const resume = {
  note: (document, person) => {
    return `Извещение: ${document.number}, код: ${person.pid}`
  },
  payBefore: (document) => {
    const datePlus10days = utils.date.addDays(document.date, 10)
    const dateYMD = utils.date.getYMD(datePlus10days)
    const dateDMY = utils.date.getDMY(dateYMD)
    return `СРОК ОПЛАТЫ ДО: ${dateDMY}`
  },
}

// рисует 2 серые линии по границе бланка - снизу и справа - по этим линиям вырезают бланк
const drawOutline = (xb, yb, doc, blank) => {
  const dx = 4
  const dy = 6
  doc.setDrawColor(214, 214, 214)

  doc.line(xb, yb + blank.height + dy, xb + blank.width + dx, yb + blank.height + dy)
  doc.line(xb + blank.width + dx, yb, xb + blank.width + dx, yb + blank.height + dy)
  doc.line(xb + blank.width, yb, xb + blank.width + dx, yb)
  doc.line(xb, yb + blank.height, xb, yb + blank.height + dy)

  doc.setDrawColor(0, 0, 0)
}
