import { db } from './db.js';
const op = (name) => `\`${name}\``;
const as = (name, alias) => `\`${name}\` as \`${alias}\``;
const yd = (name, alias, asis = null) => {
    let field = '';
    if (asis) {
        field = `${asis} as ${op(alias)}`;
    }
    else if (name === alias) {
        field = `${op(name)}`;
    }
    else {
        field = `${as(name, alias)}`;
    }
    return field;
};
/// (1) Юр-лица
// возвращает данные из Книги Счетов за period
export const getBook = async (period) => {
    const table = 'rss_book';
    const [year, month] = period.split('_'); // 2021_12
    const fields = [
        ['year', 'year'],
        ['month', 'month'],
        ['account', 'account'],
        ['date', 'date', "DATE_FORMAT(`date`, '%Y-%m-%d')"],
        ['cid', 'cid'],
        ['uf', 'type'],
        ['period1', 'period1', "DATE_FORMAT(`period1`, '%Y-%m-%d')"],
        ['period2', 'period2', "DATE_FORMAT(`period2`, '%Y-%m-%d')"],
        ['sum', 'sum', 'round(`sum`, 2)'],
        ['nds', 'nds', 'round(`nds`, 2)'],
        ['vsego', 'vsego', 'round(`vsego`, 2)'],
    ];
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`;
    const conn = await db('bill');
    const [rows] = await conn.execute(sql);
    await conn.end();
    return rows;
};
// возвращает инфо по клиентам
export const getCustomers = async (customersId) => {
    const table = 'Cust';
    const fields = [
        ['CustID', 'cid'],
        ['CustAlias', 'alias'],
        ['CustName', 'name'],
        ['CustType', 'type'],
        ['INN', 'inn'],
        ['BIK', 'bik'],
        ['KPP', 'kpp'],
        ['NumDTelRssMtc', 'dogNumber'],
        ['DateDTelRssMtc', 'dogDate', "DATE_FORMAT(`DateDTelRssMtc`, '%Y-%m-%d')"],
        ['AddressU', 'address'],
    ];
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('CustID')} IN (${customersId.join(',')})`;
    const conn = await db('cust');
    const [rows] = await conn.execute(sql);
    const customers = rows.reduce((obj, it) => {
        obj[it.cid] = it;
        return obj;
    }, {});
    await conn.end();
    return customers;
};
// SELECT year, month, account, serv, sum, nds, vsego, prim FROM `rss_serv` WHERE `year`='2021' AND `month`='11' ;
// возвращает инфо по услугам за период
export const getServices = async (period) => {
    const table = 'rss_serv';
    const [year, month] = period.split('_'); // 2021_12
    const fields = [
        ['year', 'year'],
        ['month', 'month'],
        ['account', 'account'],
        ['serv', 'serv'],
        ['sum', 'sum', 'round(`sum`, 2)'],
        ['nds', 'nds', 'round(`nds`, 2)'],
        ['vsego', 'vsego', 'round(`vsego`, 2)'],
        ['prim', 'prim'],
    ];
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`;
    const conn = await db('bill');
    const [rows] = await conn.execute(sql);
    await conn.end();
    return rows;
};
/// (2) Физ-лица
// возвращает данные из Книги Счетов по физ-лицам за period
export const getBookFiz = async (period) => {
    const table = 'rss_bookf';
    const [year, month] = period.split('_'); // 2021_12
    const fields = [
        ['year', 'year'],
        ['month', 'month'],
        ['account', 'account'],
        ['date', 'date', "DATE_FORMAT(`date`, '%Y-%m-%d')"],
        ['xcid', 'cid'],
        ['pid', 'pid'],
        ['sum', 'sum', 'round(`sum`, 2)'],
    ];
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`;
    const conn = await db('bill');
    const [rows] = await conn.execute(sql);
    await conn.end();
    return rows;
};
// возвращает инфо по клиентам (физ-лица)
export const getPersons = async (personsId) => {
    const table = 'CustKS';
    const fields = [
        ['pid', 'pid'],
        ['cid', 'cid'],
        ['name', 'name'],
        ['fio', 'fio'],
        ['xnumber', 'phone'],
        ['address', 'address'],
        ['contract_num', 'dogNumber'],
        ['contract_date', 'dogDate', "DATE_FORMAT(`contract_date`, '%Y-%m-%d')"],
    ];
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('pid')} IN (${personsId.join(',')}) ORDER BY ${op('pid')}, ${op('xnumber')}`;
    const conn = await db('cust');
    const [rows] = await conn.execute(sql);
    const persons = rows.reduce((obj, it) => {
        if (!obj[it.pid]) {
            obj[it.pid] = it;
        }
        return obj;
    }, {});
    await conn.end();
    return persons;
};
// возвращает инфо по услугам за период (физ-лица)
export const getServicesFiz = async (period) => {
    const table = 'rss_servf';
    const [year, month] = period.split('_'); // 2021_12
    const fields = [
        ['year', 'year'],
        ['month', 'month'],
        ['account', 'account'],
        ['serv', 'serv'],
        ['sum', 'sum', 'round(`sum`, 2)'],
        ['prim', 'prim'],
    ];
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`;
    const conn = await db('bill');
    const [rows] = await conn.execute(sql);
    await conn.end();
    return rows;
};
/// Позвонковая детализация
// (юр-лица):
// SELECT d.dt, d.fm, d.fm2, d.to2, d.code, d.st, d.stat, d.sec, d.min, d.tid, d.sum, d._desc, d._name
// FROM Y2021M11 AS d WHERE ((d.cid=204)
// AND (d.org = 'R') AND (d.stat rlike '[MWSZ]') AND (d.p='q') AND (d.b='+')  AND (d.ok='+') AND (d.sum >0) AND (d.id>0)) ORDER BY d.st, d.fm, d.dt;
// (физ-лица):
// SELECT d.dt, d.fm, d.fm2, d.to2, d.code, d.st, d.stat, d.sec, d.min, d.tid, d.sum, d._desc, d._name
// FROM Y2021M11 AS d WHERE ((d.cid=549) AND (d.pid=901)
// AND (d.org = 'R') AND (d.stat rlike '[MWSZ]' ) AND (d.p='q') AND (d.b='+')  AND (d.ok='+') AND (d.sum >0) AND (d.id>0)) ORDER BY d.st, d.fm, d.dt;
/**
 * (3) Позвонковая детализация (юр-лица/физ-лица)
 * @param {string} period - период, напр. 2021_11
 * @param {number} customerId - код клиента (customerId(cid)-для type=u; personalId(pid)-для type=f)
 * @param {string} type = (u|f) для юр-лиц/физ-лиц
 * @returns
 */
export const getCalls = async (period, customerId, type = 'u') => {
    const table = getTable(period);
    const [year, month] = getYearMonth(period);
    const fields = [
        ['dt', 'date', "DATE_FORMAT(`dt`, '%Y-%m-%d %H:%i')"],
        ['fm', 'abonent'],
        ['fm2', 'abonent2'],
        ['to2', 'number'],
        ['code', 'code'],
        ['st', 'traffic'],
        ['stat', 'stat'],
        ['sec', 'sec'],
        ['min', 'min'],
        ['tid', 'tid'],
        ['sum', 'sum', 'round(`sum`, 2)'],
        ['_desc', 'target'],
        ['_name', 'direction'], // направление c группировкой( напр. 'Россия моб.' для code = '988623')
    ];
    const personalCid = 549; // общий customerId(cid) для всех физ-лиц
    // юр:  ((d.cid=204) AND (d.org = 'R') AND (d.stat rlike '[MWSZ]') AND (d.p='q') AND (d.b='+')  AND (d.ok='+') AND (d.sum >0) AND (d.id>0)) ORDER BY d.st, d.fm, d.dt;
    // физ: ((d.cid=549) AND (d.pid=901) ...
    // const customer = `cid=${customerId}`
    const customer = type === 'u' ? `(cid=${customerId})` : `(cid=${personalCid} AND pid=${customerId})`;
    const where = "(`org`='R') AND (`stat` rlike '[MWSZ]') AND (`p`='q') AND (`b`='+') AND (`ok`='+') AND (`sum`>0)";
    const order = '`st`, `fm`, `dt`';
    const what = fields.map((f) => yd(f[0], f[1], f[2])).join();
    const sql = `SELECT ${what} FROM ${op(table)} WHERE (${customer} AND ${where}) ORDER BY ${order}`;
    const conn = await db('bill');
    const [rows] = await conn.execute(sql);
    await conn.end();
    return rows;
};
// 2021_12 -> [2021, 12]
const getYearMonth = (period) => period.split('_');
// 2021_12 -> Y2021M12
const getTable = (period) => {
    const [year, month] = getYearMonth(period);
    return `Y${year}M${month}`;
};
/**
 * Проверяет данные клиентов
 * @param {object} customers - клиенты, где коды клентов - это ключи
 * @returns {array} [true, []] - всё ОК, [false, errors] - есть ошибки и все они в errors
 */
export const isCustomersValid = (customers) => {
    /* One item of customers:
  '1271': {
      cid: 1271,
      alias: 'Кантри Риал Эстейт',
      name: 'ООО «Кантри Риал Эстейт» (Д.У.)',
      type: 'u',
      inn: '7707405653',
      bik: '044525388',
      kpp: '770701001',
      dogNumber: '42М/РСС/2016',
      dogDate: '2016-12-01',
      address: '127055, г. Москва, ул. Новослободская, д. 54, стр. 3, этаж 2, пом. II, к. 6'
    },
     */
    const errors = [];
    const fields = {
        cid: { re: /^\d{1,}$/, error: 'error in CustID' },
        alias: { re: /^.{2,}/, error: 'alias must be > 2 symbols' },
        name: { re: /^.{3,}/, error: 'name must be > 6 symbols' },
        type: { re: /^(u|f)$/, error: 'type customer must be "u" or "f"' },
        inn: { re: /^\d{10,}$/, error: 'inn must be 10 digits' },
        kpp: { re: /^\d{9,}$/, error: 'kpp must be 9 digits', isExceptIP: true },
        dogNumber: { re: /^.{3,}/, error: 'dogovor of number must be >=3 symbols', replace: '.' },
        dogDate: {
            re: /^\d{4}-\d{2}-\d{2}$/,
            error: 'date of dogovor must be in format: YYYY-MM-DD',
            replace: '1111-11-11',
        },
        address: { re: /^.{16,}$/, error: 'address must be >=16 symbols' },
    };
    const customerIsIP = (cust) => cust.alias.includes('ИП') || cust.name.includes('ИП');
    const excludesCust = [549]; // 549 - обобщающий код для всех физ-лиц
    const keys = Object.keys(fields);
    const customersId = Object.keys(customers);
    for (const cid of customersId) {
        if (excludesCust.includes(Number(cid))) {
            continue;
        }
        const cust = customers[cid];
        for (const k of keys) {
            if (fields[k].isExceptIP && customerIsIP(cust)) {
                continue;
            }
            if (!fields[k].re.test(cust[k]) || !cust[k]) {
                if (fields[k].replace) {
                    cust[k] = fields[k].replace;
                    console.log(`cust[k]:`, cust[k], `fields[k].replace:`, fields[k].replace);
                    continue;
                }
                errors.push(`${cust.alias}(${cid}) -> ` + fields[k].error + ` (now ${k}: '${cust[k]}')`);
            }
        }
    }
    return errors.length > 0 ? [false, errors] : [true, []];
};
