import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import minimist from 'minimist'
import { Logging } from './lib/logging.js'
import { help } from './lib/help.js'
import * as base from './lib/base.js'
import * as ut from './lib/utils.js'
import * as file from './lib/file.js'
import { Document } from './lib/document.js'
import * as arh from './lib/arhiver.js'

const opts = minimist(process.argv.slice(2), {
  alias: {
    help: 'h',
    base: 'b',
    file: 'f',
    period: 'p',
    compress: 'c',
    act: 'a',
    invoice: 'i',
    account: 't',
    notice: 'n',
    detail: 'd',
    all: 'x',
  },
})

global.appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../')
const fileLog = `${appRoot}/log/invoice-rss.log`
const pathSource = `${appRoot}/csv`
const pathResult = `${appRoot}/result`

const logging = new Logging(fileLog)
const log = logging.add.bind(logging)

const main = async () => {
  log(`cmd: ${ut.getCommandLine()}`)

  if (Boolean(opts.help) || !Boolean(opts.period) || (!Boolean(opts.base) && !Boolean(opts.file))) {
    console.log(help)
    process.exit(1)
  }

  if (Boolean(opts.base)) {
    await mainBase(opts.period)
  }

  log('.')
}

async function mainBase(period) {
  // данные по по Книге счетов и Клиентам получаем из базы
  const book = await base.getBook(period)
  const customersId = ut.getCustomersId(book)
  const customers = await base.getCustomers(customersId)
  const [ok, errors] = base.isCustomersValid(customers)
  if (!ok) {
    errors.forEach((err) => log(`warning: ${err}`, true))
  }
  const services = await base.getServices(period)

  const bookf = await base.getBookFiz(period)
  const personsId = ut.getPersonsId(bookf)
  const persons = await base.getPersons(personsId)
  const servicesf = await base.getServicesFiz(period)

  // объекты с данными отображаем в csv-файлы
  const items = [
    [book, 'book.csv'],
    [Object.values(customers), 'customers.csv'],
    [services, 'services.csv'],
    [bookf, 'bookf.csv'],
    [Object.values(persons), 'persons.csv'],
    [servicesf, 'servicesf.csv'],
  ]

  // сохраняем
  items.forEach((f) => {
    const filename = path.resolve(pathSource, period, `${period}_${f[1]}`)
    const rows = file.writeFile({ file: filename, data: f[0] })
    log(`write ${rows} rows in file: ${path.basename(filename)}`)
  })

  const doc = new Document({ period, book, customers, services, bookf, persons, servicesf, pathSource, pathResult })

  if (opts.account || opts.all) {
    const result = doc.createAccounts()
    resume('accounts', result)
  }

  if (opts.act || opts.all) {
    const result = doc.createActs()
    resume('acts', result)
  }

  if (opts.invoice || opts.all) {
    const result = doc.createInvoices()
    resume('invoices', result)

    const resultXml = doc.createInvoicesXml()
    resume('invoicesXml', resultXml)
  }

  if (opts.notice || opts.all) {
    const result = doc.createNotices()
    resume('notices', result)
  }

  if (opts.detail || opts.all) {
    let result = await doc.createDetailsUr()
    resume('detail ur', result)
    result = await doc.createDetailsFiz()
    resume('detail fiz', result)
  }

  // сжимаем результат
  const storage = `${pathResult}/${period}` // ../result/2021_12
  const fileZip = `${pathResult}/${period}_mts.zip` // ../result/2021_12_mts.zip
  const { bytes } = await arh.compressDirectory(`${storage}/`, fileZip, log)
  log(`compress: ${path.basename(fileZip)}, ${ut.bytesToMb(bytes)} mb`, true)
}

function resume(what, result) {
  log(`create ${result.totalDocuments} ${what}, sum: ${result.totalSum.toFixed(2)}`)
}

main()
