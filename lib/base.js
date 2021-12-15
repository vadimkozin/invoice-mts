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
