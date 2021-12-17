import { db } from './db.js'

const op = (name) => `\`${name}\``
const as = (name, alias) => `\`${name}\` as \`${alias}\``
const yd = (name, alias, asis = null) => {
  let field = ''

  if (asis) {
    field = `${asis} as ${op(alias)}`
  } else if (name === alias) {
    field = `${op(name)}`
  } else {
    field = `${as(name, alias)}`
  }

  return field
}

/// (1) Юр-лица
// возвращает данные из Книги Счетов за period
export const getBook = async (period) => {
  const table = 'rss_book'
  const [year, month] = period.split('_') // 2021_12
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
  ]

  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()

  const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`

  const conn = await db('bill')
  const [rows] = await conn.execute(sql)

  await conn.end()
  return rows
}

// возвращает инфо по клиентам
export const getCustomers = async (customersId) => {
  const table = 'Cust'
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
  ]
  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()

  const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('CustID')} IN (${customersId.join(',')})`

  const conn = await db('cust')
  const [rows] = await conn.execute(sql)

  const customers = rows.reduce((obj, it) => {
    obj[it.cid] = it
    return obj
  }, {})

  await conn.end()

  return customers
}

// SELECT year, month, account, serv, sum, nds, vsego, prim FROM `rss_serv` WHERE `year`='2021' AND `month`='11' ;
// возвращает инфо по услугам за период
export const getServices = async (period) => {
  const table = 'rss_serv'
  const [year, month] = period.split('_') // 2021_12
  const fields = [
    ['year', 'year'],
    ['month', 'month'],
    ['account', 'account'],
    ['serv', 'serv'],
    ['sum', 'sum', 'round(`sum`, 2)'],
    ['nds', 'nds', 'round(`nds`, 2)'],
    ['vsego', 'vsego', 'round(`vsego`, 2)'],
    ['prim', 'prim'],
  ]

  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()
  const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`

  const conn = await db('bill')
  const [rows] = await conn.execute(sql)

  await conn.end()
  return rows
}

/// (2) Физ-лица
// возвращает данные из Книги Счетов по физ-лицам за period
export const getBookFiz = async (period) => {
  const table = 'rss_bookf'
  const [year, month] = period.split('_') // 2021_12
  const fields = [
    ['year', 'year'],
    ['month', 'month'],
    ['account', 'account'],
    ['date', 'date', "DATE_FORMAT(`date`, '%Y-%m-%d')"],
    ['xcid', 'cid'],
    ['pid', 'pid'],
    ['sum', 'sum', 'round(`sum`, 2)'],
  ]

  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()

  const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`

  const conn = await db('bill')
  const [rows] = await conn.execute(sql)

  await conn.end()
  return rows
}

// возвращает инфо по клиентам (физ-лица)
export const getPersons = async (personsId) => {
  const table = 'CustKS'
  const fields = [
    ['pid', 'pid'],
    ['cid', 'cid'],
    ['name', 'name'],
    ['fio', 'fio'],
    ['xnumber', 'phone'],
    ['address', 'address'],
    ['contract_num', 'dogNumber'],
    ['contract_date', 'dogDate', "DATE_FORMAT(`contract_date`, '%Y-%m-%d')"],
  ]
  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()

  const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('pid')} IN (${personsId.join(',')}) ORDER BY ${op(
    'pid',
  )}, ${op('xnumber')}`

  const conn = await db('cust')
  const [rows] = await conn.execute(sql)

  const persons = rows.reduce((obj, it) => {
    if (!obj[it.pid]) {
      obj[it.pid] = it
    }
    return obj
  }, {})

  await conn.end()

  return persons
}

// возвращает инфо по услугам за период (физ-лица)
export const getServicesFiz = async (period) => {
  const table = 'rss_servf'
  const [year, month] = period.split('_') // 2021_12
  const fields = [
    ['year', 'year'],
    ['month', 'month'],
    ['account', 'account'],
    ['serv', 'serv'],
    ['sum', 'sum', 'round(`sum`, 2)'],
    ['prim', 'prim'],
  ]

  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()
  const sql = `SELECT ${what} FROM ${op(table)} WHERE ${op('year')}='${year}' AND ${op('month')}='${month}'`

  const conn = await db('bill')
  const [rows] = await conn.execute(sql)

  await conn.end()
  return rows
}

/// (3) Позвонковая детализация (юр-лица)
// SELECT d.dt, d.fm, d.fm2, d.to2, d.code, d.st, d.stat, d.sec, d.min, d.tid, d.sum, d._desc, d._name
// FROM Y2021M11 AS d
// WHERE ((d.cid=204) AND (d.org = 'R') AND (d.stat rlike '[MWSZ]') AND (d.p='q') AND (d.b='+')  AND (d.ok='+') AND (d.sum >0) AND (d.id>0)) ORDER BY d.st, d.fm, d.dt;
export const getCalls = async (period, customerId) => {
  const table = getTable(period)
  const [year, month] = getYearMonth(period)
  const fields = [
    ['dt', 'date', "DATE_FORMAT(`dt`, '%Y-%m-%d %H:%i')"], // дата звонка (2021-11-01 10:06)
    ['fm', 'abonent'], // номер абонента в полном виде (84996428319)
    ['fm2', 'abonent2'], // номер абонента без префиксов (6428319)
    ['to2', 'number'], // номер куда (74823421013)
    ['code', 'code'], // телефонный код (7482)
    ['st', 'traffic'], // трафик (MG, VZ)
    ['stat', 'stat'], // M,W,S -> MG; Z->VZ  - трафик детально: M-мг W-мн Z-вз S-сотовая по России
    ['sec', 'sec'], // секунд
    ['min', 'min'], // минут
    ['tid', 'tid'], // тарифный план
    ['sum', 'sum', 'round(`sum`, 2)'], // стоимость разговора
    ['_desc', 'target'], // цель звонка - направление в полном виде (напр. 'Краснодарский край' для code = '988623')
    ['_name', 'direction'], // направление c группировкой( напр. 'Россия моб.' для code = '988623')
  ]

  // ((d.cid=204) AND (d.org = 'R') AND (d.stat rlike '[MWSZ]') AND (d.p='q') AND (d.b='+')  AND (d.ok='+') AND (d.sum >0) AND (d.id>0)) ORDER BY d.st, d.fm, d.dt;

  const custId = `cid=${customerId}`
  const where = "(`org`='R') AND (`stat` rlike '[MWSZ]') AND (`p`='q') AND (`b`='+') AND (`ok`='+') AND (`sum`>0)"
  const order = '`st`, `fm`, `dt`'

  const what = fields.map((f) => yd(f[0], f[1], f[2])).join()
  const sql = `SELECT ${what} FROM ${op(table)} WHERE (${custId} AND ${where}) ORDER BY ${order}`

  const conn = await db('bill')
  const [rows] = await conn.execute(sql)

  await conn.end()
  return rows
}

// 2021_12 -> [2021, 12]
const getYearMonth = (period) => period.split('_')

// 2021_12 -> Y2021M12
const getTable = (period) => {
  const [year, month] = getYearMonth(period)
  return `Y${year}M${month}`
}
