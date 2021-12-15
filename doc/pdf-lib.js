import * as ut from '../lib/utils.js'

/**
 * Разбивает строку на несколько если строка шире чем widthMax
 * @param {object} doc - указатель на new jsPDF()
 * @param {string} str - разбираемая строка
 * @param {number} widthMax - максимальная ширина в unit (default unit='мм')
 * @returns Возвращает строку с внедрённым '\n' или оригинальную если она < widthMax
 */
const breakString = ({ doc, str, widthMax = 105, fontSize = 10, fontName = '' }) => {
  if (str.length > 1000) {
    return str
  }

  doc.setFontSize(fontSize)
  if (fontName) {
    doc.setFont(fontName)
  }

  const widthStr = doc.getTextWidth(str)

  if (widthStr <= widthMax) {
    return str
  }

  const words = str.split(/\s+/).map((w) => w + ' ')

  let [text, widthText, result] = ['', 0, '']

  for (let i = 0; i < words.length; i++) {
    const widthWord = doc.getTextWidth(words[i])
    widthText = doc.getTextWidth(text)

    if (widthText + widthWord < widthMax) {
      text += words[i]
    } else {
      const remains = words.slice(i).join('')
      const widthRemains = doc.getTextWidth(remains)

      result += text + '\n'

      if (widthRemains < widthMax) {
        result += remains
        break
      } else {
        text = words[i]
      }
    }
  }

  return result
}

const prepareLongString = ({ doc, str, widthMax = 105, fontSize = 10, fontName = '' }) => {
  const text = breakString({ doc, str, widthMax, fontSize, fontName })
  const rows = getCountRows(text)
  return { text, rows }
}

// печать слева от границы по X
const printLeft = ({ doc, str, x, y, fontSize = 10 }) => {
  doc.setFontSize(fontSize)
  doc.text(str, x - (doc.getTextWidth(str) + 1), y)
}

// печать строки по центру
const printCenter = ({ doc, str, x, y, width, fontSize = 10, fontName = '' }) => {
  doc.setFontSize(fontSize)
  if (fontName) {
    doc.setFont(fontName)
  }

  const widthStr = doc.getTextWidth(str)
  let offset = 0

  if (width > widthStr) {
    offset = (width - widthStr) / 2
  }

  doc.text(str, x + offset, y)
}

// печать по центру
// arr: 'string' || 'array'
const printCenterArray = ({ doc, arr, x, y, width, fontSize = 10, offsetRow = 3 }) => {
  if (typeof arr === 'string') {
    return printCenter({ doc, str: arr, x, y, width, fontSize })
  }

  if (Array.isArray(arr) && arr.length === 1) {
    return printCenter({ doc, str: arr[0], x, y, width, fontSize })
  }

  arr.forEach((str, index) => {
    printCenter({ doc, str, x, y: y + index * offsetRow, width, fontSize })
  })
}

// возвращает высоту строк в миллиметрах (mm)
const getHeightInMm = ({ doc, rows = 1, fontSize = 10 }) => {
  // 72pt = 1in = 25.4mm
  const pt2mm = 25.4 / 72 // 0.352(7)
  const heightPunkt = fontSize * (rows - 1) * doc.getLineHeightFactor()
  return heightPunkt * pt2mm
}

/**
 * возвращает Смещение К Центру Блоку По Высоте
 * @param {object} doc - ссылка на экземляр jsPDF
 * @param {string} str - строка (если длинная, то уже внедрён разделитель '\n')
 * @param {number} height - высота блока (мм)
 * @param {number} fontSize - размер фонта
 * @return {numder} смещение
 *
 */
const getOffsetToCenterBlockInHeight = ({ doc, str, height, fontSize = 10 }) => {
  const rows = getCountRows(str)
  const heightRows = getHeightInMm({ doc, rows, fontSize })
  const offset = (height - heightRows) / 2
  return offset
}

// печатает текст с указанием названия фонта и его размера (если нужно)
const printText = ({ doc, text, x, y, fontSize = 10, fontName = '' }) => {
  doc.setFontSize(fontSize)
  if (fontName) {
    doc.setFont(fontName)
  }
  doc.text(text, x, y)
}

// печать линии на заданную ширину
const printLine = ({ doc, x, y, width, widthLine = 0.5 }) => {
  doc.setLineWidth(widthLine)
  doc.line(x, y, x + width, y)
}
// печать линии на заданную высоту
const printLineHeight = ({ doc, x, y, height, widthLine = 0.5 }) => {
  doc.setLineWidth(widthLine)
  doc.line(x, y, x, y + height)
}

// возвращает количество строк
const getCountRows = (str) => ut.getCountSymbolInString(str, '\n') + 1

// возвращает максимальную ширину строки из массива labels
const getMaxWidth = ({ doc, labels, fontSize = 10, fontName = '' }) => {
  doc.setFontSize(fontSize)
  if (fontName) {
    doc.setFont(fontName)
  }
  const widths = labels.map((label) => doc.getTextWidth(label))

  return Math.max(...widths)
}

export {
  breakString,
  printLeft,
  printCenter,
  printCenterArray,
  getHeightInMm,
  getCountRows,
  getOffsetToCenterBlockInHeight,
  printText,
  printLine,
  printLineHeight,
  prepareLongString,
  getMaxWidth,
}
