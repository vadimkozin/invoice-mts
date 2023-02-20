const IOrganization = {
    name: '',
    inn: '',
    kpp: '',
    address: '',
    // get textOrganization() {
    //   return `ИНН ${this.inn}, КПП ${this.kpp}, ${this.name}, ${this.address}`
    // },
};
const IService = {
    name: '',
    quantity: 0,
    unit: '',
    price: 0,
    nds: 0,
    sum: 0,
};
const IPeriod = {
    start: null,
    end: null,
};
const IDocument = {
    number: '',
    date: null,
};
const IContract = {
    number: '',
    date: null,
    period: IPeriod,
};
const IManager = {
    fio: '',
    attorney: {
        number: '',
        date: null,
    },
};
const ITotal = {
    cost: 0,
    nds: 0,
    sum: 0,
    sumWords: '', // общая сумма с НДС прописью
};
// Счёт
const IAccount = {
    // получатель
    recipient: { name: '', bank: '', inn: '', bik: '', kpp: '', account: '', kaccount: '' },
    provider: IOrganization,
    customer: IOrganization,
    document: IDocument,
    isContractPrint: false,
    contract: IContract,
    // массив услуг IService
    services: [],
    // итого
    total: { sum: 0, nds: 0, sumWords: '' },
    director: IManager,
    accountant: IManager,
    phone: '', // номер телефона в правом верхнем углу счёта
};
// Акт
const IAct = {
    executer: '',
    customer: '',
    document: IDocument,
    isContractPrint: false,
    contract: IContract,
    // массив услуг IService
    services: [],
    // итого
    total: ITotal,
    director: IManager, // директор
};
// Счёт-Фактура
const IInvoice = {
    document: IDocument,
    operator: null,
    customer: null,
    services: [],
    director: IManager,
    accountant: IManager,
    total: ITotal,
    currencyName: '',
    procentNDS: 20,
    isContractPrint: false,
    contract: IContract,
};
// Извещение
const INotice = {
    operator: null,
    document: null,
    person: null, // {fio, address, phone}
};
// Один вызов
const ICall = {
    date: '',
    abonent: '',
    abonent2: '',
    number: '',
    code: '',
    traf: '',
    stat: '',
    sec: 0,
    min: 0,
    tid: 0,
    sum: 0,
    target: '',
    direction: '', // обобщённая цель (Внутризоновая)
};
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
};
