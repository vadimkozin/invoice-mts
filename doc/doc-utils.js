import * as utils from '../lib/utils.js'

export const getTextContractPeriod = (contract) => {
  const [dogDate, period1, period2] = [
    utils.date.getDMY(contract.date),
    utils.date.getDMY(contract.period.start),
    utils.date.getDMY(contract.period.end),
  ]
  return `Услуги связи согласно договора № ${contract.number} от ${dogDate} за период с ${period1} по ${period2}`
}

export const getTextAttorney = (director) => {
  const attorney = []
  attorney.push(director.fio)
  attorney.push(`По доверенности № ${director.attorney.number} от ${director.attorney.date}`)
  return attorney
}

export const getTextAttorneyInvoice = (director) => {
  return `По доверенности № ${director.attorney.number} от ${director.attorney.date}`
}

export const getTextDocument = (nameDocument, document) => {
  return `${nameDocument} № ${document.number} от ${utils.date.getDWY(document.date)}г.`
}
