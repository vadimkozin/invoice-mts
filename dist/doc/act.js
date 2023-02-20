import { jsPDF } from 'jspdf';
import * as pdf from './pdf-lib.js';
import * as du from './doc-utils.js';
/**
 * Создание Акта
 * @param {object} data - объект с данными (IAct - см. types.js) для формируемого акта
 * @param {string} nameFile - имя файла для результата
 */
export const createAct = (data, nameFile) => {
    const widthArea = 180; // ширина документа
    const nameOffsetY = 10; // смещение по Y для строк: исполнитель, заказчик, основание
    const nameOffsetX = 25; // смещение по X для зачений :исполнитель, заказчик, основание
    const addRowY = 5; // прирост по Y для каждой дополнительной строки для 'длинных' строк
    const adding = {
        // дополнительное смещение по Y для 'длинного' названия:
        operator: 0,
        customer: 0, // -- Заказчика
    };
    // console.log(`data:`, data)
    const [xb, yb] = [15, 15]; // точка отсчёта
    console.log(nameFile);
    const doc = new jsPDF({ putOnlyUsedFonts: true });
    doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', 'PT_Sans-Web-Regular', 'normal');
    doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', 'PT_Sans-Web-Bold', 'normal');
    pdf.printText({
        doc,
        text: du.getTextDocument('Акт', data.document),
        x: xb,
        y: yb,
        fontSize: 12,
        fontName: 'PT_Sans-Web-Bold',
    });
    doc.setLineWidth(0.5);
    pdf.printLine({ doc, x: xb, y: yb + 2, width: widthArea });
    doc.setFont('PT_Sans-Web-Regular');
    const operator = pdf.breakString({
        doc,
        str: getTextOperator(data.operator),
        widthMax: widthArea - nameOffsetX,
        fontSize: 10,
    });
    adding.operator = getOffset(operator, addRowY);
    const customer = pdf.breakString({
        doc,
        str: getTextCustomer(data.customer),
        widthMax: widthArea - nameOffsetX,
        fontSize: 10,
    });
    adding.customer = getOffset(customer, addRowY);
    const basis = '...'; //data.actBasis
    const xn = xb + nameOffsetX;
    const next = (index) => yb + nameOffsetY * index;
    doc.text('Исполнитель:', xb, next(1));
    doc.text(operator, xn, next(1));
    doc.text('Заказчик:', xb, next(2) + adding.operator);
    doc.text(customer, xn, next(2) + adding.operator);
    // doc.text('Основание:', xb, next(3) + adding.operator + adding.customer)
    // doc.text(basis, xn, next(3) + adding.operator + adding.customer)
    // Таблица услуг
    let x = xb;
    const tab = {
        x: xb,
        y: next(3) + adding.operator + adding.customer,
        width: widthArea,
        heightHeader: 10,
        heightSubtitle: 5,
        heightLine: 8,
        cols: [8, 120, 130, 140, 160], // x-координата колонок
    };
    let height = tab.heightHeader + tab.heightLine; // 18, минимальная высота таблицы
    let yLines = tab.y + tab.heightHeader;
    const heightLines = tab.heightLine * data.services.length;
    if (data.isContractPrint) {
        height += 5;
        yLines += tab.heightSubtitle;
    }
    if (data.services.length > 1) {
        height += tab.heightLine * (data.services.length - 1);
    }
    doc.setLineWidth(0.5);
    doc.rect(tab.x, tab.y, tab.width, height);
    doc.setLineWidth(0.25);
    doc.line(tab.x, tab.y + tab.heightHeader, tab.x + tab.width, tab.y + tab.heightHeader);
    doc.setLineWidth(0.1);
    tab.cols.forEach((x) => {
        doc.line(tab.x + x, tab.y, tab.x + x, tab.y + tab.heightHeader);
        doc.line(tab.x + x, yLines, tab.x + x, yLines + heightLines);
    });
    const yh = 6; // смещение заголовка таблицы от верха
    doc.text('№', tab.x + 2, tab.y + yh);
    pdf.printCenter({
        doc,
        str: 'Наименование работ, услуг',
        x: tab.x + tab.cols[0],
        y: tab.y + yh,
        width: 110,
        fontSize: 10,
    });
    doc.setFontSize(8);
    doc.text('Кол-во', tab.x + 121, tab.y + yh);
    doc.text('Ед.', tab.x + 133.5, tab.y + yh);
    doc.text('Цена', tab.x + 147, tab.y + yh);
    doc.text('Сумма', tab.x + 166, tab.y + yh);
    doc.setFontSize(8);
    let dy = 15; // смещение по высоте к данным
    /// таблица - subtitle : "Услуги связи согласно договора ..."
    if (data.isContractPrint) {
        pdf.printText({
            doc,
            text: du.getTextContractPeriod(data.contract),
            x: tab.x + 2,
            y: tab.y + dy - 1.5,
            fontSize: 8,
        });
        pdf.printLine({ doc, x: tab.x, y: tab.y + dy, width: tab.width, widthLine: 0.1 });
        dy += 5;
    }
    data.services.forEach((service, i) => {
        // №, Услуги связи ..., кол-во, ед.
        doc.text(String(i + 1), tab.x + 3, tab.y + dy);
        doc.text(service.name, tab.x + 10, tab.y + dy);
        doc.text(String(service.quantity), tab.x + 124, tab.y + dy);
        doc.text(String(service.unit), tab.x + 132.5, tab.y + dy);
        // цена, сумма
        pdf.printLeft({ doc, str: service.sum.toFixed(2), x: tab.x + 160, y: tab.y + dy, fontSize: 8 });
        pdf.printLeft({
            doc,
            str: service.sum.toFixed(2),
            x: tab.x + tab.width,
            y: tab.y + dy,
            fontSize: 8,
        });
        doc.line(tab.x, tab.y + dy + 3, tab.x + tab.width, tab.y + dy + 3);
        dy += tab.heightLine;
    });
    // Итоги
    // новая точка отсчёта по Y
    const yy = tab.y + dy + 2;
    const price = data.total.cost;
    const nds = data.total.nds;
    const totalSum = data.total.sum;
    const totalSumWords = data.total.sumWords;
    pdf.printLeft({ doc, str: 'Итого:', x: x + 160, y: yy, fontSize: 8 });
    pdf.printLeft({ doc, str: 'Сумма НДС 20%', x: x + 160, y: yy + 5, fontSize: 8 });
    pdf.printLeft({ doc, str: price.toFixed(2), x: x + tab.width, y: yy, fontSize: 8 });
    pdf.printLeft({ doc, str: nds.toFixed(2), x: x + tab.width, y: yy + 5, fontSize: 8 });
    const serviceCount = data.services.length;
    doc.setFontSize(8);
    const str = `Всего оказано услуг ${serviceCount}, на сумму:  ${totalSum.toFixed(2)} руб`;
    pdf.printText({ doc, text: str, x, y: yy + 10, fontSize: 10 });
    pdf.printText({ doc, text: totalSumWords, x, y: yy + 15, fontSize: 10, fontName: 'PT_Sans-Web-Bold' });
    doc.setFontSize(8);
    doc.setFont('PT_Sans-Web-Regular');
    const text = 'Вышеперечисленные услуги выполнены полностью и в срок. Заказчик претензий по объему, качеству и срокам оказания услуг не имеет.';
    doc.text(text, x, yy + 25);
    pdf.printLine({ doc, x, y: yy + 27, width: widthArea });
    const executerY = yy + 32; // ИСПОЛНИТЕЛЬ и ЗАКАЗЧИК по Y
    const heightSignatureSpace = 18; // пространство для подписей для ИСПОЛНИТЕЛЬ .. ЗАКАЗЧИК
    const lineSignatureY = yy + 37 + heightSignatureSpace; // линия для подписей под ИСПОЛНИТЕЛЬ .. ЗАКАЗЧИК
    doc.setFontSize(10);
    doc.setFont('PT_Sans-Web-Bold');
    doc.text('ИСПОЛНИТЕЛЬ', x, executerY);
    doc.text('ЗАКАЗЧИК', x + 90, executerY);
    doc.setLineWidth(0.3);
    doc.setFont('PT_Sans-Web-Bold');
    doc.line(x, lineSignatureY, x + 80, lineSignatureY);
    doc.line(x + 90, lineSignatureY, x + widthArea, lineSignatureY);
    doc.setFontSize(6);
    doc.setFont('PT_Sans-Web-Regular');
    pdf.printCenterArray({
        doc,
        arr: du.getTextAttorney(data.director),
        x: x + 2,
        y: lineSignatureY + 3,
        width: 70,
        fontSize: 6,
    });
    const executer = pdf.breakString({ doc, str: data.operator.name, widthMax: 80, fontSize: 8 });
    const offsetExecuter = pdf.getOffsetToCenterBlockInHeight({
        doc,
        str: executer,
        height: heightSignatureSpace,
        fontSize: 8,
    });
    const custom = pdf.breakString({ doc, str: data.customer.name, widthMax: 90, fontSize: 8 });
    const offsetCustom = pdf.getOffsetToCenterBlockInHeight({
        doc,
        str: custom,
        height: heightSignatureSpace,
        fontSize: 8,
    });
    doc.setFontSize(8);
    doc.text(executer, x, executerY + offsetExecuter);
    doc.text(custom, x + 90, executerY + offsetCustom);
    doc.save(nameFile);
};
// возвращает смещение по Y для 'длинной' строки
// строка уже подготовлена и разделена '\n'
function getOffset(str, offset) {
    const rows = pdf.getCountRows(str);
    return rows > 2 ? offset * (rows - 2) : 0;
}
const getTextOperator = (operator) => {
    return `${operator.name}, ИНН ${operator.inn}, ${operator.address}`;
};
const getTextCustomer = (customer) => {
    return `${customer.name}, ИНН ${customer.inn}, ${customer.address}`;
};
