import { resolve } from 'node:path'
import fs from 'fs-extra'
import { createAccount } from '../doc/account.js'
import { createAct } from '../doc/act.js'
import { createInvoice } from '../doc/invoice.js'
import { createNotice } from '../doc/notice.js'
import { createCalls } from '../doc/calls.js'

import { getCostInWords } from './cost-in-words.js'
import * as constant from './constant.js'

import * as base from './base.js'
import * as file from './file.js'

const serviceCodeToTextMap = {
  MG: 'Услуги МГ/МН телефонной связи',
  VZ: 'Услуги внутризоновой телефонной связи',
}

export class Document {
  /**
   *
   * @param {string} period - период, ex. 2021_12
   * @param {array} book - книга счетов за период
   * @param {object} customers - клиенты
   * @param {array} services - услуги за период
   * @param {array} bookf - книга счетов за период (физ-лица)
   * @param {object} persons - клиенты (физ-лица)
   * @param {array} servicesf - услуги за период (физ-лица)
   * @param {string} pathSource - место для источников (csv)
   * @param {string} pathResult - место для результатов (pdf)
   */
  constructor({ period, book, customers, services, bookf, persons, servicesf, pathSource, pathResult }) {
    this.period = period
    this.book = book
    this.customers = customers
    this.services = services

    this.bookf = bookf
    this.persons = persons
    this.servicesf = servicesf

    this.pathSource = pathSource
    this.pathSourceCalls = resolve(pathSource, period, 'calls')

    this.pathResultUr = resolve(pathResult, period, 'ur')
    this.pathResultFiz = resolve(pathResult, period, 'fiz')

    fs.ensureDirSync(this.pathSourceCalls)
    fs.ensureDirSync(this.pathResultUr)
  }

  createAccounts() {
    const result = { totalDocuments: 0, totalSum: 0 }

    this.book.forEach((b) => {
      const customer = this._getCustomer(b.cid)
      const period = { start: b.period1, end: b.period2 }
      const sumWords = getCostInWords(b.vsego)
      const contract = { number: customer.dogNumber, date: customer.dogDate, period }
      const document = { number: `${constant.docum.prefixDocNumber}${b.account}`, date: b.date }
      const director = this._getDirector()
      const isContractPrint = true

      const data = {
        recipient: constant.a2,
        provider: constant.operatorMts,
        customer,
        services: this._getServices(b.account),
        document,
        contract,
        isContractPrint,
        total: { sum: b.vsego, nds: b.nds, sumWords },
        director,
        accountant: director,
        phone: constant.docum.phone,
      }

      if (b.type === 'u') {
        const dir = this._createDirectory(this.pathResultUr, customer.alias, customer.cid)
        createAccount(data, this._getNameFile(this.period, dir, customer.alias, 'account'))
        result.totalDocuments += 1
        result.totalSum += b.sum
      }
    })
    return result
  }

  createActs() {
    const result = { totalDocuments: 0, totalSum: 0 }

    this.book.forEach((b) => {
      const customer = this._getCustomer(b.cid)
      const period = { start: b.period1, end: b.period2 }
      const sumWords = getCostInWords(b.vsego)
      const contract = { number: customer.dogNumber, date: customer.dogDate, period }
      const document = { number: `${constant.docum.prefixDocNumber}${b.account}`, date: b.date }
      const director = this._getDirector()
      const isContractPrint = true

      const data = {
        document,
        operator: constant.operatorMts,
        customer,
        services: this._getServicesAct(b.account),
        contract,
        isContractPrint,
        total: { cost: b.sum, nds: b.nds, sum: b.vsego, sumWords },
        director,
      }

      if (b.type === 'u') {
        const dir = this._createDirectory(this.pathResultUr, customer.alias, customer.cid)
        createAct(data, this._getNameFile(this.period, dir, customer.alias, 'act'))
        result.totalDocuments += 1
        result.totalSum += b.sum
      }
    })
    return result
  }

  createInvoices() {
    const result = { totalDocuments: 0, totalSum: 0 }

    this.book.forEach((b) => {
      const customer = this._getCustomer(b.cid)
      const period = { start: b.period1, end: b.period2 }
      const sumWords = getCostInWords(b.vsego)
      const contract = { number: customer.dogNumber, date: customer.dogDate, period }
      const document = { number: `${constant.docum.prefixDocNumber}${b.account}`, date: b.date }
      const director = this._getDirector()
      const isContractPrint = true

      const data = {
        document,
        operator: constant.operatorMts, // в СФ - это продавец
        customer,
        services: this._getServicesInvoice(b.account),
        director,
        accountant: director,
        total: { cost: b.sum, nds: b.nds, sum: b.vsego, sumWords },
        currencyName: constant.docum.currencyName,
        procentNDS: constant.docum.procentNDS,
        unit: { code: constant.docum.invoice.unitCode, sym: constant.docum.invoice.unitSym },
        contract,
        isContractPrint,
      }

      if (b.type === 'u') {
        const dir = this._createDirectory(this.pathResultUr, customer.alias, customer.cid)
        createInvoice(data, this._getNameFile(this.period, dir, customer.alias, 'invoice'))
        result.totalDocuments += 1
        result.totalSum += b.sum
      }
    })
    return result
  }

  createNotices() {
    const result = { totalDocuments: 0, totalSum: 0 }

    this.bookf.forEach((b) => {
      const person = this._getPerson(b.pid)
      const period = { year: b.year, month: b.month }
      const document = { number: `${b.account}`, date: b.date, sum: b.sum, period }

      const data = {
        person,
        document,
        operator: constant.a2,
      }

      const dir = this._createDirectory(this.pathResultFiz, person.name, person.pid)
      createNotice(data, this._getNameFile(this.period, dir, person.name, 'notice'))
      result.totalDocuments += 1
      result.totalSum += b.sum
    })
    return result
  }

  async createDetails() {
    const result = { totalDocuments: 0, totalSum: 0 }

    for (const b of this.book.filter((b) => b.type === 'u')) {
      // console.log(b.cid)
      const customer = this._getCustomer(b.cid)
      const filename = this._getNameFile(this.period, this.pathSourceCalls, customer.alias, 'calls', 'csv')
      const calls = await base.getCalls(this.period, b.cid)
      const rows = file.writeFile({ file: filename, data: calls })

      const dir = this._createDirectory(this.pathResultUr, customer.alias, customer.cid)

      createCalls({
        data: calls,
        period: this.period,
        custName: customer.name,
        custId: customer.cid,
        nameFile: this._getNameFile(this.period, dir, customer.alias, 'calls'),
      })

      result.totalDocuments += 1
      result.totalSum += b.sum
    }
    return result
  }

  async createDetailsFiz() {
    const result = { totalDocuments: 0, totalSum: 0 }

    for (const b of this.bookf) {
      console.log(b.cid, b.pid)
      const person = this._getPerson(b.pid)
      const filename = this._getNameFile(this.period, this.pathSourceCalls, person.name, 'calls', 'csv')
      const calls = await base.getCalls(this.period, b.cid)
      const rows = file.writeFile({ file: filename, data: calls })

      const dir = this._createDirectory(this.pathResultUr, customer.alias, customer.cid)

      createCalls({
        data: calls,
        period: this.period,
        custName: customer.name,
        custId: customer.cid,
        nameFile: this._getNameFile(this.period, dir, customer.alias, 'calls'),
      })

      result.totalDocuments += 1
      result.totalSum += b.sum
    }
    return result
  }

  _getCustomer(customerId) {
    return this.customers[customerId]
  }

  _getPerson(personId) {
    return this.persons[personId]
  }

  _getServices(account) {
    const services = this.services.filter((s) => s.account == account)
    return services.map((s) => {
      return {
        name: serviceCodeToTextMap[s.serv],
        quantity: 1,
        unit: 'мес.',
        price: s.vsego,
        sum: s.vsego,
      }
    })
  }

  _getServicesAct(account) {
    const services = this.services.filter((s) => s.account == account)
    return services.map((s) => {
      return {
        name: serviceCodeToTextMap[s.serv],
        quantity: 1,
        unit: 'мес.',
        price: s.sum,
        sum: s.sum,
      }
    })
  }

  _getServicesInvoice(account) {
    const services = this.services.filter((s) => s.account == account)
    return services.map((s) => {
      return {
        name: serviceCodeToTextMap[s.serv],
        quantity: 1,
        unit: 'мес.',
        cost: s.sum,
        nds: s.nds,
        sum: s.vsego,
      }
    })
  }

  _getDirector() {
    return {
      fio: constant.executer.fio,
      attorney: {
        number: constant.executer.attorneyNumber,
        date: constant.executer.attorneyDate,
      },
    }
  }

  _createDirectory(path, customerName, customerId) {
    const dir = resolve(path, `${this._replaceSpace(customerName)}__${String(customerId)}`)
    fs.ensureDirSync(dir)
    return dir
  }

  _getNameFile(period, path, customerName, typeDocum, ext = 'pdf') {
    return resolve(path, `${period}_${this._replaceSpace(customerName)}_${constant.docum.suffix[typeDocum]}.${ext}`)
  }

  _replaceSpace(str) {
    return str.replaceAll(' ', '_')
  }
}
