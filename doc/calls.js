import { jsPDF } from 'jspdf'
import * as pdf from './pdf-lib.js'
import * as utils from '../lib/utils.js'
import * as constant from '../lib/constant.js'

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
 * @param {string} custName - имя клиента
 * @param {number} custId - код клиента
 * @return {*} создаёт файл `nameFile`.pdf
 */
export const createCalls = ({ data, nameFile, period, custName, custId }) => {
  const [xb, yb] = [15, 15] // точка отсчёта
  const tab = {
    titles: { MG: 'междугородняя/международная связь', VZ: 'внутризоновая связь' },
    width: 154, // ширина
    dy: 5, // смещение между строками по Y
    dy2: 8, // смещение для разделов
    // поля:
    abonent: { name: 'Абонент', w: 20, x: 0 },
    date: { name: 'Дата', w: 22, x: 20, isDate: true },
    number: { name: 'Номер', w: 28, x: 42 },
    code: { name: 'Код', w: 18, x: 70 },
    target: { name: 'Направление', w: 36, x: 88 },
    min: { name: 'Мин', w: 8, x: 124, isRight: true },
    sum: { name: 'Сумма', w: 22, x: 132, isRight: true, isCurrency: true },
    // колонки (названия из data)
    fields: ['abonent', 'date', 'number', 'code', 'target', 'min', 'sum'],
  }
  const grey = [214, 214, 214]
  const printPageNumber = nextPage()

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

  // console.log(nameFile)

  const doc = new jsPDF({ putOnlyUsedFonts: true })
  const bold = 'PT_Sans-Web-Bold'
  const regular = 'PT_Sans-Web-Regular'
  doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', regular, 'normal')
  doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', bold, 'normal')
  doc.setFont('PT_Sans-Web-Regular')

  let y = yb

  /// (1) Header
  const [header, heightHeader] = getHeader({ doc, period, custName, custId, fontSize: 10 })
  pdf.printText({ doc, text: header, x: xb, y, fontSize: 10 })

  y += heightHeader + 7

  /// (2) Названия колонок
  printHeaderColumns({ doc, tab, fields: tab.fields, x: xb, y, fontName: bold })

  doc.setFont(regular)

  y += 2
  /// (2a) Линия под названиями колонок
  pdf.printLine({ doc, x: xb, y, width: tab.width, widthLine: 0.5, color: grey })

  if (custId == 1212) {
    console.log(data)
  }

  y += 4

  /// (3) Вызовы
  data.forEach((d, index) => {
    // итоги
    if (group.abonent.current != d.abonent && index > 0) {
      printResumeAbonent({ doc, tab, group, x: xb, y })
      y += tab.dy2
    }
    if (group.traffic.current != d.traffic && index > 0) {
      printResumeTraffic({ doc, tab, group, x: xb, y })
      y += tab.dy
    }

    // заголовки МГ / ВЗ
    if (group.traffic.current != d.traffic) {
      y += 2
      pdf.printText({ doc, text: tab.titles[d.traffic], x: xb, y, fontSize: 9, fontName: bold })
      group.resetTraffic()
      y += tab.dy
      doc.setFont(regular)
    }

    // инфо по вызову
    printOneCall({ doc, data: d, tab, fields: tab.fields, x: xb, y })
    y += tab.dy

    group.addTraffic(d)
    group.addAbonent(d)
    group.addTotal(d)
  })

  if (group.abonent.current) {
    printResumeAbonent({ doc, tab, group, x: xb, y })
    y += tab.dy2
  }
  if (group.traffic.current) {
    printResumeTraffic({ doc, tab, group, x: xb, y })
    y += tab.dy2
  }
  if (group.total.sum) {
    pdf.printLine({ doc, x: xb, y, width: tab.width, widthLine: 0.5, color: grey })
    y += 4
    printResumeTotal({ doc, tab, group, x: xb, y })
    y += tab.dy2
  }

  console.log(`y:`, y)
  y = printFooter({ doc, x: xb, y })

  console.log(`y:`, y)

  printPageNumber({ doc, x: xb, y, widthPage: tab.width })

  if (y > 280) {
    doc.addPage()
    doc.text('Do you like that?', 20, 20)
  }

  doc.save(nameFile)
}

/// (4) вспомогатьные функции
const getHeader = ({ doc, period, custName, custId, fontSize }) => {
  const header = []
  const [year, month] = period.split('_') // 2021_12
  let monthText = constant.MonthDigitToNameMap[Number(month)]
  monthText = monthText.slice(0, 1).toUpperCase() + monthText.slice(1)

  header.push(`${custName} (id=${custId})`)
  header.push(`Расшифровка за цифровой канал связи(соединения по межгороду)`)
  header.push(`${monthText} ${year}г (стоимость без НДС)`)

  const height = pdf.getHeightInMm({ doc, rows: 3, fontSize })

  return [header.join('\n'), height]
}

const printResumeAbonent = ({ doc, tab, group, x, y }) => {
  const fontSize = 7
  console.log(`group.abonent:`, group.abonent)
  const abonentTotal = `тел: ${group.abonent.current}, всего разговоров: ${group.abonent.calls}`
  pdf.printText({ doc, text: abonentTotal, x, y, fontSize })
  pdf.printLeft({ doc, str: String(group.abonent.min), x: x + tab.min.x + tab.min.w, y, fontSize })
  pdf.printLeft({ doc, str: getTextCost(group.abonent.sum), x: x + tab.sum.x + tab.sum.w, y, fontSize })

  group.resetAbonent()
}

const printResumeTraffic = ({ doc, tab, group, x, y }) => {
  const fontSize = 7
  console.log(`group.traffic:`, group.traffic)
  const text = `всего (${tab.titles[group.traffic.current]})`
  pdf.printLeft({ doc, str: text, x: x + tab.target.x + tab.target.w, y, fontSize })
  pdf.printLeft({ doc, str: String(group.traffic.min), x: x + tab.min.x + tab.min.w, y, fontSize })
  pdf.printLeft({ doc, str: getTextCost(group.traffic.sum), x: x + tab.sum.x + tab.sum.w, y, fontSize })

  group.resetTraffic()
}

const printResumeTotal = ({ doc, tab, group, x, y }) => {
  const fontSize = 8
  console.log(`group.total:`, group.total)
  // const trafTotal = `calls: ${group.total.calls}: мин: ${group.total.min}, сумма: ${group.total.sum.toFixed(2)}`
  // pdf.printText({ doc, text: trafTotal, x, y, fontSize: 9 })

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
  const fontSize = 7

  fields.forEach((field) => {
    const f = tab[field]
    let value = tab[field].isCurrency ? getTextCost(data[field]) : String(data[field])
    value = tab[field].isDate ? getDate(value) : value

    if (tab[field].isRight) {
      pdf.printLeft({ doc, str: value, x: x + f.x + f.w, y, fontSize })
    } else {
      pdf.printText({ doc, text: value, x: x + f.x, y, fontSize })
    }
  })
}

// 2021-11-03 12:36  -> 03-11-2021 12:36
const getDate = (date) => {
  const [dt, time] = date.split(' ') // [2021-11-03, 12:36]
  const [year, m, d] = dt.split('-') // [2021, 11, 03]
  const y = year.slice(2)
  return `${d}-${m}-${y} ${time}`
}

const printFooter = ({ doc, x, y }) => {
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

const nextPage = () => {
  let page = 1
  return ({ doc, x, y, widthPage }) => {
    pdf.printLeft({ doc, str: `page ${page++}`, x: x + widthPage, y, fontSize: 7 })
    console.log(`page: ${page}`)
    return page
  }
}
