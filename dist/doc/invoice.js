import { jsPDF } from 'jspdf';
import * as invoice from './invoice-func.js';
/**
 * Создание Счёта-фактуры
 * @param {object} data - объект с данными (IData - см. func.js) для формируемого акта
 * @param {string} nameFile - имя файла для результата
 */
export const createInvoice = (data, nameFile) => {
    const cfg = {
        widthArea: 275,
        countService: data.services.length,
        startX: 10,
        startY: 10,
        stepHeaderY: 5,
        table: {
            heightRow1: 20,
            heightRow2: 4,
            heightContract: 5,
            heightData: 8,
            heightLast: 4, // высота последней строки таблицы ('всего к оплате')
        },
    };
    console.log(nameFile);
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210],
        putOnlyUsedFonts: true,
    });
    doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', 'PT_Sans-Web-Regular', 'normal');
    doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', 'PT_Sans-Web-Bold', 'normal');
    doc.setFont('PT_Sans-Web-Regular');
    doc.setFontSize(10);
    let currentY = invoice.drawHeader({ doc, cfg, data });
    currentY = invoice.drawTable({ doc, cfg, data, currentY, offsetY: 5 });
    invoice.drawBottom({ doc, cfg, data, currentY, offsetY: 8 });
    doc.save(nameFile);
};
