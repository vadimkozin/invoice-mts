const IOrganization = {
  name: '',
  inn: '',
  kpp: '',
  address: '',
  // get textOrganization() {
  //   return `ИНН ${this.inn}, КПП ${this.kpp}, ${this.name}, ${this.address}`
  // },
}

const IService = {
  name: '',
  quantity: 0,
  unit: '',
  price: 0,
  nds: 0,
  sum: 0,
}

const IPeriod = {
  start: null,
  end: null,
}

const IDocument = {
  number: '',
  date: null,
}

const IContract = {
  number: '',
  date: null,
  period: IPeriod,
}

const IManager = {
  fio: '',
  attorney: {
    number: '',
    date: null,
  },
}

const ITotal = {
  cost: 0, // общая сумма цифрами (без НДС)
  nds: 0, // общий НДС
  sum: 0, // cost + nds
  sumWords: '', // общая сумма с НДС прописью
}

// Счёт
const IAccount = {
  // получатель
  recipient: { name: '', bank: '', inn: '', bik: '', kpp: '', account: '', kaccount: '' },

  provider: IOrganization, // поставщик
  customer: IOrganization, // покупатель

  document: IDocument, // Счёт ... за ...
  isContractPrint: false, // Печать "Услуги по договору.. " в таблице "Товары(работы, услуги)"
  contract: IContract,

  // массив услуг IService
  services: [],

  // итого
  total: { sum: 0, nds: 0, sumWords: '' },

  director: IManager, // директор
  accountant: IManager, // бухгалтер

  phone: '', // номер телефона в правом верхнем углу счёта
}

// Акт
const IAct = {
  executer: '', // исполнитель
  customer: '', //  заказчик
  document: IDocument, // Акт ... за ...

  isContractPrint: false, // ? Печать "Услуги по договору.. " в таблице "Товары(работы, услуги)"
  contract: IContract,

  // массив услуг IService
  services: [],

  // итого
  total: ITotal,

  director: IManager, // директор
}

// Счёт-Фактура
const IInvoice = {
  document: IDocument, // Счёт фактура № ... от ...
  operator: null, // в СФ - это продавец
  customer: null, // покупатель
  services: [], // массив услуг IService
  director: IManager, // директор
  accountant: IManager, // бухгалтер
  total: ITotal,
  currencyName: '', // наименованеи валюты для СФ
  procentNDS: 20, // НДС в %
  isContractPrint: false, // ? Печать "Услуги связи по договору.." в таблице
  contract: IContract,
}

// Извещение
const INotice = {
  operator: null, // в Извещении - это А2 {name,inn,kpp,bik,bank,account,kaccount}
  document: null, // {number, date, sum, period}
  person: null, // {fio, address, phone}
}

// Один вызов
const ICall = {
  date: '', // дата звонка (2021-11-09 13:01)
  abonent: '', // номер абонента полный (74956261322)
  abonent2: '', // номер абонента краткий (6261322)
  number: '', // вызываемый (целевой) номер (88617648339)
  code: '', // телефонный код направления (7861)
  traf: '', // тип трафика (MG,MN)
  stat: '', // тип трафика детально (MWSZ)
  sec: 0, // продолжительность, секунд
  min: 0, // продолжительность, минут
  tid: 0, // тарифный план
  sum: 0, // сумма за разговор
  target: '', // цель звонка (г. Москва и Московская область)
  direction: '', // обобщённая цель (Внутризоновая)
}

/*
const org = IOrganization
org.name = 'ПАО МТС'
org.inn = '12345'
org.kpp = '6789'
org.address = 'Кривоколенный 5'

console.log(org.textOrganization)

const manager = IManager
manager.fio = 'Иванов'
manager.attorney.number = '234/bis'
manager.attorney.date = '21-11-2021'
console.log(manager.textAnnorney)

const document = IDocument
document.number = 'A2-295'
document.date = '31-10-2021'
console.log(document.textDocument)

const account = IAccount
account.document.doc.number = 'A2-295'
account.document.doc.date = '31 октября 2021'
account.document.period.start = '01-10-21'
account.document.period.end = '31-10-21'

console.log(account.document.textDocumAbout)
*/

export default {
  IAccount,
  IOrganization,
  IManager,
  IDocument,
  INotice,
}
