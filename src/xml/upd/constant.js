const parameters = {
  KND: '1115131', // классификатор налоговых документов КНД=1115131 для СФ с 01-01-2020
  ROSSIA: '643', // код России по Общероссийскому классификатору стран мира
  OKB: '643', // Общероссийский классификатор валют
  VERSION_PROG: '[a2-billing] v.1.0.0',
  VERSION_FORM: '5.01',
  OKEI: '362', // ОКЕИ - общероссийский классификатор единиц измерения, 362 - месяц
  OKEI_NAME: 'мес',
  NOAKCIZ: 'без акциза',
  NDS_20: 20, // НДС 20%
  servCodeToTextMap: {
    VZ: 'Услуги внутризоновой телефонной связи',
    MG: 'Услуги МГ/МН телефонной связи',
  },
  PREFIX_DOC: 'A2-', // префикс у документов, наприммер, СФ № A2-429,
  FUNCTION: 'СЧФДОП',
  // ПоФактХЖ
  PO_FACT_HJ:
    'Документ об отгрузке товаров (выполнении работ), передаче имущественных прав (документ об оказании услуг)',
  // НаимДокОпр
  NAME_DOC_OTPR:
    'Счет-фактура и документ об отгрузке товаров (выполнении работ), передаче имущественных прав (документ об оказании услуг)',
  // СвПер.СодОпер
  SOD_OPER: 'Товары переданы, работы сданы, услуги оказаны',
  // Валюта: Наименование
  NAME_OKB: 'Российский рубль',
  // НаимДокОтгр
  NAME_DOC_OTGR: 'Реализация (акт, накладная, УПД)',
}

const mts = {
  name: 'Публичное акционерное общество «Мобильные ТелеСистемы»',
  nameShort: 'ПАО «МТС»',
  address: '109147, г.Москва, ул.Марксистская, д.4',
  inn: '7740000076',
  kpp: '770901001',
  type: 'u',
  okpo: '52686811',
  ogrn: '1027700149124',
}

const sport = {
  name: 'АО «Северный порт»',
  nameShort: 'АО «Северный порт»',
  address: '125195,г.Москва,Ленинградское ш., д.57',
  inn: '7712007390',
  kpp: '774301001',
  type: 'u',
}

const scandipack = {
  name: 'Общество с ограниченной ответственностью «СКАНДИ ПАКК»',
  nameShort: 'ООО «СКАНДИ ПАКК»',
  address:
    '141281, РФ, Московская область, г.Пушкино, г. Ивантеевка, ул. Железнодорожная д. 1',
  inn: '7724000760',
  kpp: '501601001',
  type: 'u',
  dogovor: {
    number: '456/МТС',
    date: '01.02.2022',
  },
}

const ip_ovanecian = {
  name: 'Индивидуальный предприниматель Ованесян Наира Робертовна',
  nameShort: 'ИП Ованесян Наира Робертовна',
  address: '125195, г. Москва, Ленинградское шоссе, дом 61, строение 4',
  inn: '773472705540',
  kpp: '',
  type: 'ip',
}

const podpisant = {
  position: 'Генеральный директор',
  fio: {
    name: 'Никита',
    fam: 'Петухов',
    ot: 'Алексеевич',
  },
  getFullName() {
    return `${this.fam} ${this.name} ${this.ot}`
  },
  proxy: {
    number: '77АГ5249557',
    date: '25.12.2020',
    text: 'По доверенности № 77АГ5249557 от 25.12.2020',
  },
}

/*
КНД = 1115131 ?
С 1 января 2020 года при формировании счета-фактуры в электронной форме применяется формат счета-фактуры (КНД) 1115131, версия формата 5.01 (утв. приказом ФНС России от 09.12.2018 № ММВ-7-15/820@).
https://its.1c.ru/db/newsclar/content/468985/hdoc#:~:text=%D0%A1%201%20%D1%8F%D0%BD%D0%B2%D0%B0%D1%80%D1%8F%202020%20%D0%B3%D0%BE%D0%B4%D0%B0,7%2D15%2F820%40).
*/

export { mts, podpisant, parameters, sport, ip_ovanecian, scandipack }
