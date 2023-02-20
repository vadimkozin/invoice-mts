import * as pdf from './pdf-lib.js'
import * as utils from '../lib/utils.js'
import * as du from './doc-utils.js'

// data.total.cost - общая стоимость
// data.total.nds - общая НДС
// data.total.sum - общая стоимость с НДС

/// (1) Заголовок СФ
// prettier-ignore
export const drawHeader = ({ doc, cfg, data }) => {
    // адреса и названия организаций могут быть большими и их надо размещать более чем на одной строке
    // вычисляем дополнительное пространство для строк
    const [addressOperator, addressCustomer, countRowAddress] = 
      calculateCountRows({doc, str1: data.operator.address, str2: data.customer.address, wMax1: 100, wMax2: 85, fontSize: 8})
    const addingAddress = (countRowAddress - 1) * cfg.stepHeaderY
    
    const operator = `${data.operator.name} (${data.operator.nameShort})`
    
    const [nameOperator, nameCustomer, countRowName] = 
      calculateCountRows({doc, str1: operator, str2: data.customer.name, wMax1: 100, wMax2: 85, fontSize: 10})
    const addingName = (countRowName - 1) * cfg.stepHeaderY

    // Left side
    const x = cfg.startX
    const y = cfg.startY
    const dy = cfg.stepHeaderY
    const next = (index) => y + dy * index + addingAddress + addingName
    
    let xline = x + 42
    let width = 100
    doc.setDrawColor(127, 127, 127)

    print({doc, label:'Счёт-фактура №', value: data.document.number, x, y, xline, width: 40, fontSize: 10, center: true})
    text({doc, label:'от', x: x + 90, y, fontSize: 10})
    print({doc, label:'', value: getDateDWY(data.document.date), x: x+102, y, xline: x+102, width: 40, fontSize: 10, center: true, end:'(1)'})

    print({doc, label:'Исправление №', value: '--', x, y: y + dy * 1, xline, width:40, fontSize:10, center: true})
    text({doc, label:'от', x: x + 90, y: y + dy * 1, fontSize: 10})
    print({doc, label:'', value: '--', x: x+102, y: y + dy * 1, xline: x+102, width:40, fontSize:10, center: true, end:'(1a)'})

    print({doc, label:'Продавец:', bold:true, value: nameOperator, x, y: y + dy * 2, xline, width, fontSize: [10, 10], end:'(2)', adding: addingName})
    print({doc, label:'Адрес:', value: addressOperator, x, y: y + dy * 3 + addingName, xline, width, fontSize:8, end:'(2a)', adding: addingAddress})

    let inn_kpp = `${data.operator.inn}/${data.operator.kpp}`
    print({doc, label:'ИНН/КПП продавца:', value: inn_kpp, x, y: next(4) , xline, width, fontSize:8, end:'(2б)'})
    print({doc, label:'Грузоотправитель и его адрес:', value: '--', x, y: next(5), xline, width, fontSize:8, end:'(3)'})
    print({doc, label:'Грузополучатель и его адрес:', value: '--', x, y: next(6), xline, width, fontSize:8, end:'(4)'})
    print({doc, label:'К платёжно-расчётному документу:', value: '--', x, y: next(7), xline, width, fontSize:[7,8],  end:'(5)'})
    const docShipment = `${data.document.number} от ${getDateDWY(data.document.date)}`

    print({doc, label:'Документ об отгрузке:', value: docShipment, x, y: next(8), xline, width, fontSize:8, end:'(5a)'})

    // Right side
    const xr = x + 150
    xline = xr + 33
    width = 85
  
    let str = 'Приложение № 1 к постановлению Правительства Российской Федерации от 26 декабря 2011 г. № 1137'
    pdf.printLeft({doc, str, x: x + cfg.widthArea, y, fontSize: 6})
    str = '(в редакции постановления Правительства Российской Федерации от 2 апреля 2021 г. № 534)'
    pdf.printLeft({doc, str, x: x + cfg.widthArea, y: y + 3, fontSize: 6})

    print({doc, label:'Покупатель:', bold: true, value: nameCustomer, x:xr, y:y + dy * 2, xline, width, fontSize:10, end:'(6)', adding: addingName})
    print({doc, label:'Адрес:', value: addressCustomer, x:xr, y:y + dy * 3 + addingName, xline, width, fontSize:8, end:'(6a)', adding: addingAddress})

    inn_kpp = `${data.customer.inn}/${data.customer.kpp}`
    print({doc, label:'ИНН/КПП покупателя:', value: inn_kpp, x:xr, y: next(4), xline, width, fontSize:8, end:'(6б)'})
    print({doc, label:'Валюта: наименование, код', value: data.currencyName, x:xr, y: next(5), xline, width, fontSize:[7, 8], end:'(7)'})
    text({doc, label:'Идентификатор государственного контракта,', x:xr, y: next(6), fontSize:7})
    print({doc, label:'договора (соглашения) (при наличии):', value: '', x:xr, y: next(7), xline:xr+53, width:65, fontSize:[7, 8], end:'(8)'})

    return cfg.startY + cfg.stepHeaderY * 8 + addingAddress + addingName // current Y
}

/// (2) Cодержание таблицы
export const drawTable = ({ doc, cfg, data, currentY, offsetY = 5 }) => {
  const [xt, yt] = [cfg.startX, currentY + offsetY] // начало таблицы

  const heightHeader = cfg.table.heightRow1 + cfg.table.heightRow2 // 24

  // Шапка таблицы (линии)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.line(xt, yt, xt + cfg.widthArea, yt)
  doc.line(xt, yt + cfg.table.heightRow1, xt + cfg.widthArea, yt + cfg.table.heightRow1)
  doc.line(xt, yt + heightHeader, xt + cfg.widthArea, yt + heightHeader)

  const widthsColumns = [6, 50, 14, 6, 18, 14, 16, 21, 12, 14, 19, 22, 12, 17, 34] // все ширины колонок (=275)
  const widthsColumns2 = [6, 50, 14, 24, 14, 16, 21, 12, 14, 19, 22, 29, 34] // кроме 2-колонок, делящихся еще на две (колонки: 2,2a и 10,10а)
  const widthsColumns3 = [124, 21, 26, 19, 22, 63] // итоговые вертикальные ('всего к оплате')

  // prettier-ignore
  const labelsInColumns = ['1', '1a', '1б', '2', '2а', '3', '4', '5', '6', '7', '8', '9', '10', '10а', '11',]

  const xHalfSizeColumns = [76, 224]
  const horizontalLines = [
    [xt + 70, yt + 10, 24],
    [xt + 212, yt + 10, 29],
  ]

  let xdelta = 0

  widthsColumns2.forEach((w) => {
    doc.line(xt + xdelta, yt, xt + xdelta, yt + heightHeader)
    xdelta += w
  })
  doc.line(xt + xdelta, yt, xt + xdelta, yt + heightHeader)

  xHalfSizeColumns.forEach((delta) => {
    doc.line(xt + delta, yt + 10, xt + delta, yt + heightHeader)
  })

  // горизонтальные линии 2x-колонок, делящихся еще на две (колонки: 2,2a и 10,10а)
  horizontalLines.forEach((it, i) => {
    const [x, y, width] = it
    doc.line(x, y, x + width, y)
  })

  // Шапка таблицы (текст)
  // prettier-ignore
  {
    const w = widthsColumns
    let step = 3
    let offset = 0
    let width = w[0]
    pdf.printCenter({doc, str: '№', x: xt + offset, y: yt + 9 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'n/n', x: xt + offset, y: yt + 9 + step*1, width, fontSize: 7})

    offset = w[0]; width = w[1]
    pdf.printCenter({doc, str: 'Наименование товара (описание', x: xt + offset, y: yt + 6, width, fontSize: 7})
    pdf.printCenter({doc, str: 'выполненных работ, оказанных услуг),', x: xt + offset, y: yt + 10, width, fontSize: 7})
    pdf.printCenter({doc, str: 'имущественного права', x: xt + offset, y: yt + 14, width, fontSize: 7})

    offset += w[1]; width = w[2]
    pdf.printCenter({doc, str: 'Код вида', x: xt + offset, y: yt + 9 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'товара', x: xt + offset, y: yt + 9 + step*1, width, fontSize: 7})
    
    offset += w[2]; width = w[3] + w[4]
    pdf.printCenter({doc, str: 'Единица', x: xt + offset, y: yt + 4 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'Измерения', x: xt + offset, y: yt + 4 + step*1, width, fontSize: 7})

    width = w[3]
    pdf.printCenter({doc, str: 'код', x: xt + offset, y: yt + 16 + step*0, width, fontSize: 7})

    offset += w[3]; width = w[4]
    pdf.printCenter({doc, str: 'условное', x: xt + offset, y: yt + 13 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'обозначение', x: xt + offset, y: yt + 13 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: '(национальное)', x: xt + offset, y: yt + 13 + step*2, width, fontSize: 6.7})

    offset += w[4]; width = w[5]
    pdf.printCenter({doc, str: 'Количество', x: xt + offset, y: yt + 9 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: '(объём)', x: xt + offset, y: yt + 9 + step*1, width, fontSize: 7})

    offset += w[5]; width = w[6]
    pdf.printCenter({doc, str: 'Цена(тариф)', x: xt + offset, y: yt + 8 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'за единицу', x: xt + offset, y: yt + 8 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: 'измерения', x: xt + offset, y: yt + 8 + step*2, width, fontSize: 7})

    offset += w[6]; width = w[7]
    pdf.printCenter({doc, str: 'Стоимость товаров', x: xt + offset, y: yt + 4 + step*0, width, fontSize: 6.5})
    pdf.printCenter({doc, str: '(работ, услуг),', x: xt + offset, y: yt + 4 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: 'имущественных', x: xt + offset, y: yt + 4 + step*2, width, fontSize: 7})
    pdf.printCenter({doc, str: 'прав без налога -', x: xt + offset, y: yt + 4 + step*3, width, fontSize: 7})
    pdf.printCenter({doc, str: 'всего', x: xt + offset, y: yt + 4 + step*4, width, fontSize: 7})

    offset += w[7]; width = w[8]
    pdf.printCenter({doc, str: 'В том', x: xt + offset, y: yt + 5 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'числе', x: xt + offset, y: yt + 5 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: 'сумма', x: xt + offset, y: yt + 5 + step*2, width, fontSize: 7})
    pdf.printCenter({doc, str: 'акциза', x: xt + offset, y: yt + 5 + step*3, width, fontSize: 7})

    offset += w[8]; width = w[9]
    pdf.printCenter({doc, str: 'Налоговая', x: xt + offset, y: yt + 9 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'ставка', x: xt + offset, y: yt + 9 + step*1, width, fontSize: 7})

    offset += w[9]; width = w[10]
    pdf.printCenter({doc, str: 'Сумма налога,', x: xt + offset, y: yt + 8 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'предъявляемая', x: xt + offset, y: yt + 8 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: 'покупателю', x: xt + offset, y: yt + 8 + step*2, width, fontSize: 7})

    offset += w[10]; width = w[11]
    pdf.printCenter({doc, str: 'Стоимость товаров', x: xt + offset, y: yt + 4 + step*0, width, fontSize: 6.5})
    pdf.printCenter({doc, str: '(работ, услуг),', x: xt + offset, y: yt + 4 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: 'имущественных', x: xt + offset, y: yt + 4 + step*2, width, fontSize: 7})
    pdf.printCenter({doc, str: 'с налогом -', x: xt + offset, y: yt + 4 + step*3, width, fontSize: 7})
    pdf.printCenter({doc, str: 'всего', x: xt + offset, y: yt + 4 + step*4, width, fontSize: 7})

    offset += w[11]; width = w[12] + w[13]
    pdf.printCenter({doc, str: 'Страна', x: xt + offset, y: yt + 4 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'происхождения товара', x: xt + offset, y: yt + 4 + step*1, width, fontSize: 7})

    width = w[12]
    pdf.printCenter({doc, str: 'цифровой', x: xt + offset, y: yt + 15 + step*0, width, fontSize: 6.5})
    pdf.printCenter({doc, str: 'код', x: xt + offset, y: yt + 15 + step*1, width, fontSize: 7})

    offset += w[12]; width = w[13]
    pdf.printCenter({doc, str: 'краткое', x: xt + offset, y: yt + 15 + step*0, width, fontSize: 7})
    pdf.printCenter({doc, str: 'наименование', x: xt + offset, y: yt + 15 + step*1, width, fontSize: 6.8})

    offset += w[13]; width = w[14]
    pdf.printCenter({doc, str: 'Регистрационный номер', x: xt + offset, y: yt + 4 + step*0, width, fontSize: 6.5})
    pdf.printCenter({doc, str: 'декларации на товары или', x: xt + offset, y: yt + 4 + step*1, width, fontSize: 7})
    pdf.printCenter({doc, str: 'регистрационный номер', x: xt + offset, y: yt + 4 + step*2, width, fontSize: 7})
    pdf.printCenter({doc, str: 'партии товара, подлежащего', x: xt + offset, y: yt + 4 + step*3, width, fontSize: 7})
    pdf.printCenter({doc, str: 'прослеживаемости', x: xt + offset, y: yt + 4 + step*4, width, fontSize: 7})
  }

  // Метки в колонках: 1, 1а, 1б, 2, ..
  const yLabels = 22.8 // смещение по Y от начала таблицы до меток 1, 1a, 1b, 2, ...

  let offset = 0
  // prettier-ignore
  widthsColumns.forEach((w, i) => {
    pdf.printCenter({doc, str: labelsInColumns[i], x: xt + offset, y: yt + yLabels, width: w, fontSize: 7})
    offset += w
  })

  let heightContract = 0

  if (data.isContractPrint) {
    heightContract = cfg.table.heightContract
    const yContract = yLabels + 4.5 // смещение по Y от начала таблицы до 'Услуги связи согласно ...'

    text({ doc, label: du.getTextContractPeriod(data.contract), x: xt + 2, y: yt + yContract, fontSize: 7 })
    doc.line(xt, yt + heightHeader + heightContract, xt + cfg.widthArea, yt + heightHeader + heightContract)
    doc.line(xt, yt + heightHeader, xt, yt + heightHeader + heightContract)
    doc.line(xt + cfg.widthArea, yt + heightHeader, xt + cfg.widthArea, yt + heightHeader + heightContract)
  }

  // Данные в таблице
  // prettier-ignore
  {
    // console.log(`data.services:`, data.services)
    data.services.forEach((service, index) => {      
      const w = widthsColumns
      let offset = 0
      let width = w[0]
      let y = yt + heightHeader + heightContract + cfg.table.heightData * (index + 1) - 4

      const fontSize = 7

      pdf.printCenter({doc, str: String(index + 1), x: xt + offset , y, width, fontSize})
      
      offset = w[0]; width = w[1]
      const name = pdf.breakString({doc, str: service.name, widthMax: width - 1, fontSize})
      text({doc, label:name, x: xt + offset + 1, y, fontSize})
      
      offset += w[1]; width = w[2]
      pdf.printCenter({doc, str: '--', x: xt + offset, y, width, fontSize})

      offset += w[2]; width = w[3]
      pdf.printCenter({doc, str: data.unit.code, x: xt + offset, y, width, fontSize})

      offset += w[3]; width = w[4]
      pdf.printCenter({doc, str: data.unit.sym, x: xt + offset, y, width, fontSize})

      offset += w[4]; width = w[5]
      pdf.printCenter({doc, str: String(service.quantity), x: xt + offset, y, width, fontSize})

      offset += w[5] + w[6]
      const cost = service.cost.toFixed(2)
      pdf.printLeft({doc, str: cost, x: xt + offset, y, fontSize})

      offset += w[7]
      pdf.printLeft({doc, str: cost, x: xt + offset, y, fontSize})

      width = w[8]
      pdf.printCenter({doc, str: 'без акциза', x: xt + offset, y, width, fontSize: 6})

      offset += w[8]; width = w[9]
      pdf.printCenter({doc, str: `${data.procentNDS}%`, x: xt + offset, y, width, fontSize})

      offset += w[9] + w[10]
      pdf.printLeft({doc, str: service.nds.toFixed(2), x: xt + offset, y, fontSize})

      offset += w[11]
      pdf.printLeft({doc, str: service.sum.toFixed(2), x: xt + offset, y, fontSize})

      width = w[12]
      pdf.printCenter({doc, str: '--', x: xt + offset, y, width, fontSize})

      offset += w[12]; width = w[13]
      pdf.printCenter({doc, str: '--', x: xt + offset, y, width, fontSize})

      offset += w[13]; width = w[14]
      pdf.printCenter({doc, str: '--', x: xt + offset, y, width, fontSize})


      // конец строки с данными - нужно снизу провести линию и продлить вертикальные линии таблицы
      const height = heightHeader  + heightContract + cfg.table.heightData * (index + 1)

      // горизонтальная
      doc.setLineWidth(0.25)
      doc.line(xt, yt + height, xt + cfg.widthArea, yt + height)

      // вертикальные
      doc.setLineWidth(0.35)
      let offsetX = 0
      let yy = yt + heightHeader + heightContract

      const step = cfg.table.heightData * (index + 1)

      widthsColumns.forEach((w) => {
        doc.line(xt + offsetX, yy, xt + offsetX, yy + step)
        offsetX += w
      })
      doc.line(xt + offsetX, yy, xt + offsetX, yy + step)
    })
  }

  // Итоговая строка таблицы
  // prettier-ignore
  { 
    const w = widthsColumns
    let offset = 0
    let width = w[0]
    const fontSize = 7
    const offsetFinalY = heightHeader + heightContract + cfg.table.heightData * cfg.countService + 4

    const y = yt + offsetFinalY - 1

    offset = 0
    text({ doc,  label: 'Всего к оплате (9)', x: xt + offset + 1, y , fontSize, bold: true })
    
    offset = totalWidth(w, 0, 7); width = w[7]
    pdf.printLeft({doc, str: data.total.cost.toFixed(2), x: xt + offset, y, fontSize})

    offset = totalWidth(w, 0, 7); width = w[8] + w[9]
    pdf.printCenter({doc, str: 'X', x: xt + offset, y, width, fontSize})

    offset = totalWidth(w, 0, 10); width = w[10]
    pdf.printLeft({doc, str: data.total.nds.toFixed(2), x: xt + offset, y, fontSize})

    offset = totalWidth(w, 0, 11); width = w[11]
    pdf.printLeft({doc, str: data.total.sum.toFixed(2), x: xt + offset, y, fontSize})
        
    // линии в последней строке таблицы ('всего к оплате')
    // горизонтальная
    doc.setLineWidth(0.25)
    doc.line(xt, yt + offsetFinalY, xt +cfg.widthArea, yt + offsetFinalY)

    // вертикальные
    doc.setLineWidth(0.35)
    
    let offsetX = 0
    const offsetY = heightHeader + heightContract + cfg.table.heightData * cfg.countService

    let yy = yt + offsetY

    widthsColumns3.forEach((_, i, arr) => {
      doc.line(xt + offsetX, yy, xt + offsetX, yy + cfg.table.heightLast )
      offsetX = totalWidth(arr, 0, i)
    })
    doc.line(xt + offsetX, yy, xt + offsetX, yy + cfg.table.heightLast)
  }

  // currentY
  return yt + heightHeader + heightContract + cfg.table.heightData * cfg.countService + cfg.table.heightLast
}

/// (3) Подписи под таблицей (руководитель, бухгалтер, ..)
export const drawBottom = ({ doc, cfg, data, currentY, offsetY = 8 }) => {
  const xt = cfg.startX // начало блока под таблицей
  const yy = currentY + offsetY

  const director = 'Руководитель организации\nили иное уполномоченное лицо'
  const accountant = 'Главный бухгалтер\nили иное уполномоченное лицо'
  const businessman = 'Индивидуальный предприниматель\nили иное уполномоченное лицо'
  const certificate = '(реквизиты свидетельства о государственной регистрации индивидуального предпринимателя)'
  const fontSize = 8

  const fioDirector = `/ ${data.director.fio} /`
  const fioAccountant = `/ ${data.accountant.fio} /`
  const signDirector = du.getTextAttorneyInvoice(data.director)
  const signAccountant = du.getTextAttorneyInvoice(data.accountant)
  const bottomText = '(подпись)' + ' '.repeat(40) + '(ф.и.о)' + ' '.repeat(8)

  const signatures = {
    director: {
      line: { x: 49, y: yy + 4, w: 76 },
      fio: fioDirector,
      sign: signDirector,
      bottom: bottomText,
    },
    businessman: { line: { x: 49, y: yy + 26, w: 76 }, fio: '', sign: '', bottom: bottomText },
    accountant: {
      line: { x: 185, y: yy + 4, w: 76 },
      fio: fioAccountant,
      sign: signAccountant,
      bottom: bottomText,
    },
    certificate: {
      line: { x: 140, y: yy + 26, w: 120 },
      fio: '',
      sign: '',
      bottom: certificate,
    },
  }

  text({ doc, label: director, x: xt, y: yy, fontSize })
  text({ doc, label: businessman, x: xt, y: yy + 21 + 7, fontSize })
  text({ doc, label: accountant, x: xt + 136, y: yy, fontSize })

  doc.setDrawColor(127, 127, 127)
  doc.setLineWidth(0.2)

  const s = signatures

  Object.keys(signatures).forEach((k) => {
    const x = xt + s[k].line.x
    const x2 = x + s[k].line.w
    const y = s[k].line.y
    const width = s[k].line.w

    doc.line(x, s[k].line.y, x2, s[k].line.y)
    pdf.printLeft({ doc, str: s[k].fio, x: x2, y: s[k].line.y - 1, fontSize })
    pdf.printCenter({ doc, str: s[k].bottom, x, y: y + 2.5, width, fontSize: 7 })
    // text({ doc, label: s[k].sign, x, y: y + 6.5, fontSize })
    pdf.printCenterArray({ doc, arr: s[k].sign, x, y: y + 6.5, width, fontSize: 7, offsetRow: 3.5 })
  })
}

/// (4) Вспомогательные ф-ии
const getDateDWY = (date) => `${utils.date.getDWY(date)}г.`

// общая ширина начиная с индекса start до end (включая)
const totalWidth = (array, start, end) => {
  return array.filter((it, index) => index >= start && index <= end).reduce((a, b) => a + b)
}

// prettier-ignore
const print = ({ doc, label, value, x, y, xline, width, fontSize = 10, end = '', bold = false, center = false, adding = 0 }) => {
  
  const fontSizeLastLabel = 7

  if (typeof fontSize === 'number') {
    fontSize = [fontSize, fontSize]
  } else if (Array.isArray(fontSize)) {
    if (fontSize.length === 1) {
      fontSize[1] = fontSize[0]
    }
  }

  doc.setFontSize(fontSize[0])

  if (bold) {
    doc.setFont('PT_Sans-Web-Bold')
  }

  doc.text(label, x, y)
  doc.setFontSize(fontSize[1])

  if (center) {
    pdf.printCenter({ doc, str: value, x:xline, y, width, fontSize:fontSize[1] })
  } else {
    doc.text(value, xline, y)
  }

  doc.line(xline, y + 1 + adding, xline + width, y + 1 + adding)

  doc.setFont('PT_Sans-Web-Regular')
  doc.setFontSize(fontSizeLastLabel)
  doc.text('  ' + end, xline + width, y)
}

const text = ({ doc, label, x, y, fontSize = 10, bold = false }) => {
  doc.setFontSize(fontSize)
  if (bold) {
    doc.setFont('PT_Sans-Web-Bold')
  }
  doc.text(label, x, y)
  doc.setFont('PT_Sans-Web-Regular')
}

// вычисление дополнительного пространства для длинных строк
const calculateCountRows = ({ doc, str1, str2, wMax1, wMax2, fontSize }) => {
  const string1 = pdf.breakString({ doc, str: str1, widthMax: wMax1, fontSize })
  const string2 = pdf.breakString({ doc, str: str2, widthMax: wMax2, fontSize })

  const countRow1 = utils.getCountSymbolInString(string1, '\n') + 1
  const countRow2 = utils.getCountSymbolInString(string2, '\n') + 1
  const countRow = Math.max(countRow1, countRow2)

  return [string1, string2, countRow]
}
