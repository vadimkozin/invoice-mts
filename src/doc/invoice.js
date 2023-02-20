
import { jsPDF } from 'jspdf'
import * as invoice from './invoice-func.js'

/**
 * Создание Счёта-фактуры
 * @param {object} data - объект с данными (IData - см. func.js) для формируемого акта
 * @param {string} nameFile - имя файла для результата
 */
export const createInvoice = (data, nameFile) => {
  const cfg = {
    widthArea: 275, // максимальная ширина документа
    countService: data.services.length, // количество услуг
    startX: 10, // начало документа по X
    startY: 10, // начало документа по Y
    stepHeaderY: 5, // шаг по Y для верхней части документа (до таблицы)
    table: {
      heightRow1: 20, // высота первой строки таблицы (шапка)
      heightRow2: 4, // высота второй строки таблицы (метки колонок: 1, 1a, 2 ..)
      heightContract: 5, // высота третьей строки таблицы ('Услуги связи согласно ...')
      heightData: 8, // высота четвёртой, 5-й, .. строки таблицы (данные: название услуги, стоимость и тп)
      heightLast: 4, // высота последней строки таблицы ('всего к оплате')
    },
  }

  console.log(nameFile)

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 210],
    putOnlyUsedFonts: true,
  })

  doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', 'PT_Sans-Web-Regular', 'normal')
  doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', 'PT_Sans-Web-Bold', 'normal')
  doc.setFont('PT_Sans-Web-Regular')
  doc.setFontSize(10)

  let currentY = invoice.drawHeader({ doc, cfg, data })
  currentY = invoice.drawTable({ doc, cfg, data, currentY, offsetY: 5 })
  invoice.drawBottom({ doc, cfg, data, currentY, offsetY: 8 })

  doc.save(nameFile)
}
