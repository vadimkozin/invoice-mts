import { jsPDF } from 'jspdf';
import * as pdf from './pdf-lib.js';
import * as utils from '../lib/utils.js';
/**
 * Создание Счёта
 * @param {object} data - объект с данными (IAccount - см. types.IAccount)
 * @param {string} nameFile - имя файла для результата
 */
export const createAccount = (data, nameFile) => {
    const op = {
        widthArea: 185,
        // top table - "Образец заполнения ...""
        tab: {
            height: 34,
            cols: [110, 20, 55],
            rows1: [14, 5, 15],
            rows2: [7, 7, 20], // 34, высота строк во 2-й и 3-й колонке
        },
        // body table - "Товары (работы, услуги) .."
        tab2: {
            cols: [120, 12, 9, 20, 24],
            labels: ['Товары (работы, услуги)', 'Кол-во', 'Ед.', 'Цена', 'Сумма'],
            hightRow: 5,
            hightRow2: 7, // высота строк: начиная с 3-й (услуги)
        },
    };
    const [xb, yb] = [10, 10]; // точка отсчёта
    let yc = yb; // текущий Y
    console.log(nameFile);
    const doc = new jsPDF({ putOnlyUsedFonts: true });
    doc.addFont('./fonts/PT_Sans-Web-Regular.ttf', 'PT_Sans-Web-Regular', 'normal');
    doc.addFont('./fonts/PT_Sans-Web-Bold.ttf', 'PT_Sans-Web-Bold', 'normal');
    // (1.header) Образец заполнения ...
    pdf.printCenter({
        doc,
        str: 'Образец заполнения платёжного поручения',
        x: xb,
        y: yb,
        width: op.widthArea,
        fontSize: 10,
        fontName: 'PT_Sans-Web-Bold',
    });
    doc.setFont('PT_Sans-Web-Regular');
    pdf.printLeft({ doc, str: `Тел: ${data.phone}`, x: xb + op.widthArea, y: yc, fontSize: 7 });
    doc.setFontSize(10);
    /// 1.a Top-table)
    yc += 3;
    const yStartTable1 = yc;
    doc.setLineWidth(0.5);
    doc.rect(xb, yb + 3, op.widthArea, op.tab.height);
    doc.setLineWidth(0.2);
    let offset = 0;
    // top-tab - вертикальные линии
    for (let i = 0; i < op.tab.cols.length; i++) {
        offset += op.tab.cols[i];
        doc.line(xb + offset, yc, xb + offset, yc + op.tab.height);
    }
    offset = 0;
    // top-tab -  строки левой колонки [14, 5, 15]
    for (let i = 0; i < op.tab.rows1.length; i++) {
        offset += op.tab.rows1[i];
        doc.line(xb, yc + offset, xb + op.tab.cols[0], yc + offset);
    }
    offset = 0;
    // top-tab -  строки правой колонки
    for (let i = 0; i < op.tab.rows2.length; i++) {
        offset += op.tab.rows2[i];
        doc.line(xb + op.tab.cols[0], yc + offset, xb + op.widthArea, yc + offset);
    }
    yc += op.tab.height;
    yc += 8;
    /// 1.b заполнение таблицы
    const rt = data.recipient;
    let yt = yStartTable1;
    const indent = 1;
    doc.text('Банк получателя', xb + indent, yt + op.tab.rows1[0] - indent);
    doc.text(rt.bank, xb + indent, yt + 3.5);
    offset = op.tab.rows1[0] + op.tab.rows1[1];
    doc.text(`ИНН  ${rt.inn}`, xb + indent, yt + offset - 1.25);
    let offsetCenter = op.tab.cols[0] / 2;
    doc.text(`|  КПП  ${rt.kpp}`, xb + offsetCenter, yt + offset - 1.25);
    offset = sum({ arr: op.tab.rows1 });
    doc.text('Получатель', xb + indent, yt + offset - indent);
    doc.text(rt.name, xb + indent, yt + sum({ arr: op.tab.rows1, end: 2 }) + 3.5);
    doc.text('БИК', xb + indent + op.tab.cols[0], yt + 5);
    doc.text('Сч. №', xb + indent + op.tab.cols[0], yt + 4.5 + op.tab.rows2[0]);
    doc.text('Сч. №', xb + indent + op.tab.cols[0], yt + 4 + sum({ arr: op.tab.rows2, end: 2 }));
    doc.text(rt.bik, xb + indent + sum({ arr: op.tab.cols, end: 2 }), yt + 5);
    doc.text(rt.kaccount, xb + indent + sum({ arr: op.tab.cols, end: 2 }), yt + 4.5 + op.tab.rows2[0]);
    doc.text(rt.account, xb + indent + sum({ arr: op.tab.cols, end: 2 }), yt + 4 + sum({ arr: op.tab.rows2, end: 2 }));
    /// 2. заголовок: "Счёт на оплату ..."
    pdf.printCenter({
        doc,
        str: getTextDocument(data.document),
        x: xb,
        y: yc,
        width: op.widthArea,
        fontSize: 10,
        fontName: 'PT_Sans-Web-Bold',
    });
    doc.setFont('PT_Sans-Web-Regular');
    yc += 7;
    /// 3. Поставщик и Покупатель
    let labels = ['Поставщик :  ', 'Покупатель :  '];
    const organizations = [data.provider, data.customer];
    const maxWidth = pdf.getMaxWidth({ doc, labels, fontSize: 10 });
    labels.forEach((label, i) => {
        doc.text(label, xb, yc);
        let { text, rows } = pdf.prepareLongString({
            doc,
            str: getTextOrganization(organizations[i]),
            widthMax: op.widthArea - maxWidth,
            fontSize: 10,
        });
        doc.text(text, xb + maxWidth, yc);
        yc += pdf.getHeightInMm({ doc, rows, fontSize: 10 }) + 6;
    });
    yc += 1;
    const yTableStart = yc;
    /// 4. таблица - header "Таблица товаров (работ, услуг)"
    let [widthThin, widthNormal, widthBold] = [0.1, 0.25, 0.5];
    doc.setLineWidth(widthBold);
    doc.rect(xb, yc, op.widthArea, op.tab2.hightRow);
    pdf.printLine({ doc, x: xb, y: yc, width: op.widthArea, widthLine: widthBold });
    pdf.printLine({ doc, x: xb, y: yc + op.tab2.hightRow, width: op.widthArea, widthLine: widthBold });
    let x = xb;
    op.tab2.cols.forEach((w, i) => {
        const str = op.tab2.labels[i];
        pdf.printCenter({ doc, str, x, y: yc + 3.5, width: w, fontSize: 9 });
        pdf.printLineHeight({ doc, x, y: yc, height: op.tab2.hightRow, widthLine: widthNormal });
        x += w;
    });
    pdf.printLineHeight({ doc, x, y: yc, height: op.tab2.hightRow, widthLine: widthBold });
    yc += op.tab2.hightRow;
    /// 4. таблица - subtitle : "Услуги связи согласно договора ..."
    if (data.isContractPrint) {
        yc += op.tab2.hightRow;
        pdf.printText({ doc, text: getTextContractPeriod(data.contract), x: xb + 2, y: yc - 1.5, fontSize: 8 });
        pdf.printLine({ doc, x: xb, y: yc, width: op.widthArea, widthLine: widthNormal });
    }
    const yServicesStart = yc;
    /// 4. таблица - перечень услуг - каждая в отдельной строке
    yc += op.tab2.hightRow2;
    data.services.forEach((s, i) => {
        let xc = xb;
        pdf.printText({ doc, text: `${i + 1}. ${s.name}`, x: xb + 2, y: yc - 2.5, fontSize: 9 });
        pdf.printLine({ doc, x: xb, y: yc, width: op.widthArea, widthLine: widthNormal });
        let index = 0;
        xc += op.tab2.cols[index];
        let wn = op.tab2.cols[index + 1];
        pdf.printCenter({ doc, str: String(s.quantity), x: xc, y: yc - 2.5, width: wn, fontSize: 9 });
        index += 1;
        xc += op.tab2.cols[index];
        wn = op.tab2.cols[index + 1];
        pdf.printCenter({ doc, str: String(s.unit), x: xc, y: yc - 2.5, width: wn, fontSize: 9 });
        index += 1;
        xc += op.tab2.cols[index];
        wn = op.tab2.cols[index + 1];
        pdf.printLeft({ doc, str: String(s.price), x: xc + wn, y: yc - 2.5, fontSize: 9 });
        index += 1;
        xc += op.tab2.cols[index];
        wn = op.tab2.cols[index + 1];
        pdf.printLeft({ doc, str: String(s.sum), x: xc + wn, y: yc - 2.5, fontSize: 9 });
        yc += op.tab2.hightRow2;
    });
    const countHeaders = data.isContractPrint ? 2 : 1;
    const countServices = data.services.length;
    const heightHeaders = op.tab2.hightRow * countHeaders;
    const heightServices = op.tab2.hightRow2 * countServices;
    /// 4. таблица - внешняя граница
    doc.setLineWidth(widthBold);
    doc.rect(xb, yTableStart, op.widthArea, heightHeaders + heightServices);
    /// 4. таблица - вертикальные линии в
    doc.setLineWidth(widthNormal);
    offset = 0;
    for (let i = 0; i < op.tab2.cols.length; i++) {
        offset += op.tab2.cols[i];
        doc.line(xb + offset, yServicesStart, xb + offset, yServicesStart + heightServices);
    }
    // 5. Итого
    const width = op.tab2.cols.slice(0, op.tab2.cols.length - 1).reduce((a, b) => a + b);
    pdf.printLeft({ doc, str: 'ИТОГО:', x: xb + width, y: yc, fontSize: 10 });
    pdf.printLeft({ doc, str: String(data.total.sum), x: xb + op.widthArea, y: yc, fontSize: 10 });
    yc += op.tab2.hightRow2;
    pdf.printLeft({ doc, str: 'В том числе НДС:', x: xb + width, y: yc, fontSize: 10 });
    pdf.printLeft({ doc, str: String(data.total.nds), x: xb + op.widthArea, y: yc, fontSize: 10 });
    yc += op.tab2.hightRow2;
    let total = `Всего наименований ${countServices} на сумму ${data.total.sum} руб.`;
    pdf.printText({ doc, text: total, x: xb, y: yc, fontSize: 9 });
    yc += op.tab2.hightRow2;
    total = `Всего к оплате: ${data.total.sumWords}`;
    pdf.printText({ doc, text: total, x: xb, y: yc, fontSize: 9 });
    yc += 2;
    doc.setDrawColor(127, 127, 127);
    pdf.printLine({ doc, x: xb, y: yc, width: op.widthArea });
    yc += 10;
    // 6. Под таблицей - подписи
    let text = 'Руководитель ';
    let fio = `/ ${data.director.fio} /`;
    let gap = 10;
    let gapHalf = gap / 2;
    let widthHalf = op.widthArea / 2;
    let widthText = doc.getTextWidth(text);
    let w = widthHalf - gapHalf - widthText;
    pdf.printText({ doc, text, x: xb, y: yc, fontSize: 9 });
    pdf.printLine({ doc, x: xb + widthText, y: yc, width: w, widthLine: widthNormal });
    pdf.printLeft({ doc, str: fio, x: xb + widthHalf - gapHalf, y: yc - 0.75, fontSize: 8 });
    text = 'Бухгалтер ';
    fio = `/ ${data.accountant.fio} /`;
    widthText = doc.getTextWidth(text);
    w = widthHalf - gapHalf - widthText;
    pdf.printText({ doc, text, x: xb + widthHalf + gapHalf, y: yc, fontSize: 9 });
    pdf.printLine({ doc, x: xb + widthHalf + gapHalf + widthText, y: yc, width: w, widthLine: widthNormal });
    pdf.printLeft({ doc, str: fio, x: xb + op.widthArea, y: yc - 0.75, fontSize: 8 });
    yc += 7;
    // 6. Под таблицей - доверенности
    let attorney = getTextAnnorney(data.director.attorney);
    pdf.printLeft({ doc, str: attorney, x: xb + widthHalf - gapHalf, y: yc - 0.75, fontSize: 7 });
    attorney = getTextAnnorney(data.accountant.attorney);
    pdf.printLeft({ doc, str: attorney, x: xb + op.widthArea, y: yc - 0.75, fontSize: 7 });
    doc.save(nameFile);
};
const getTextOrganization = (item) => {
    const kpp = item.kpp ? `КПП ${item.kpp}, ` : '';
    return `ИНН ${item.inn}, ${kpp} ${item.name}, ${item.address}`;
};
const getTextDocument = (document) => {
    return `CЧЁТ на оплату № ${document.number} от ${utils.date.getDWY(document.date)}г.`;
};
const getTextContractPeriod = (contract) => {
    const [dogDate, period1, period2] = [
        utils.date.getDMY(contract.date),
        utils.date.getDMY(contract.period.start),
        utils.date.getDMY(contract.period.end),
    ];
    return `Услуги связи согласно договора № ${contract.number} от ${dogDate} за период с ${period1} по ${period2}`;
};
const getTextAnnorney = (attorney) => {
    return `По доверенности № ${attorney.number} от ${attorney.date}`;
};
const sum = ({ arr, start = 0, end = -1 }) => {
    if (end === -1) {
        end = arr.length;
    }
    return arr.slice(start, end).reduce((a, b) => a + b);
};
