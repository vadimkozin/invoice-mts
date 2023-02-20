// ТаблСчФакт: Сведения таблицы счета - фактуры
interface ITable {
  СведТов: {
    '@@НомСтр': number // номер строки
    '@@НаимТов': string
    '@@ОКЕИ_Тов': string
    '@@КолТов': number
    '@@ЦенаТов': number
    '@@СтТовБезНДС': number
    '@@НалСт': string
    '@@СтТовУчНал': number
    Акциз: { БезАкциз: string }
    СумНал: { СумНал: number }
    ДопСведТов: { '@@НаимЕдИзм': string }
  }[]
  ВсегоОпл: {
    '@@СтТовБезНДСВсего': number
    '@@СтТовУчНалВсего': number
    СумНалВсего: {
      СумНал: number
    }
  }
}

// Подписант : Сведения о лице, подписывающем файл обмена
interface IPodpisant {
  '@@ОблПолн': string
  '@@Статус': string
  '@@ОснПолн': string
  ЮЛ: {
    '@@ИННЮЛ': string
    '@@НаимОрг': string
    '@@Должн': string
    ФИО: {
      '@@Фамилия': string
      '@@Имя': string
      '@@Отчество': string
    }
  }
}

// СвУчДокОбор : Сведения об участниках электронного документооборота
interface ISvUchDocObor {
  '@@ИдОтпр': string
  '@@ИдПол': string
}

// ДокПодтвОтгр : Реквизиты документа, подтверждающего отгрузку
interface IDocPodtvOtgr {
  '@@НаимДокОтгр': string
  '@@НомДокОтгр': string
  '@@ДатаДокОтгр': string
}

// СвПрод : Сведения продавца
interface ISvProd {
  '@@КраткНазв': string
  ИдСв: {
    СвЮЛУч: { '@@НаимОрг': string; '@@ИННЮЛ': string; '@@КПП': string }
  }
  Адрес: {
    АдрИнф: { '@@КодСтр': string; '@@АдрТекст': string }
  }
}

// СвПокуп : Сведения покупателя
interface ISvPokup {
  '@@КраткНазв': string
  ИдСв: {
    СвЮЛУч: { '@@НаимОрг': string; '@@ИННЮЛ': string; '@@КПП': string }
  }
  Адрес: {
    АдрИнф: { '@@КодСтр': string; '@@АдрТекст': string }
  }
}

// формируемый документ
interface IDocument {
  Файл: {
    '@@ИдФайл': string
    '@@ВерсПрог': string
    '@@ВерсФорм': string
    СвУчДокОбор: ISvUchDocObor
    Документ: {
      '@@КНД': string
      '@@Функция': string
      '@@ДатаИнфПр': string
      '@@ВремИнфПр': string
      '@@НаимЭконСубСост': string
      СвСчФакт: {
        '@@НомерСчФ': string
        '@@ДатаСчФ': string
        '@@КодОКВ': string
        СвПрод: ISvProd
        СвПокуп: ISvPokup
        ДокПодтвОтгр: IDocPodtvOtgr
      }
      ТаблСчФакт: ITable
      Подписант: IPodpisant
    }
  }
}

// СвСчФакт: Сведения Счёт-фактуры
interface ISvChFact {
  '@@НомерСчФ': string
  '@@ДатаСчФ': string
  '@@КодОКВ': string
  СвПрод: ISvProd
  СвПокуп: ISvPokup
  ДокПодтвОтгр: IDocPodtvOtgr
}

// данные СФ
interface IInvoice {
  num: string // номер СФ
  date: Date // дата СФ
}

// Cтоимость товара (услуги)
interface ICost {
  raw: number // стоимость товара без НДС (100)
  full: number // стоимость с НДС (120)
  nds: number // стоимость НДС (20)
}

// данные по продукту(услуге)
interface IProduct {
  count: number // номер строки в таблице
  name: string // наименование товара(услуги)
  OKEI: string // код товара по ОКЕИ (362)
  quantity: number // количество товаров(1)
  cost: ICost // стоимость
}

// данные стоимости товаров(услуг)
interface IData {
  products: IProduct[] // список продуктов(услуг)
  total: ICost // общая стомость
}

// одна услуга в таблице СФ
interface IServiceItem {
  servType: string
  cost: ICost
}

// список услуг в таблице СФ
interface IServices {
  items: IServiceItem[]
  total: ICost
}

// buyer and seller - покупатель и продавец
interface Organization {
  inn: string
  kpp: string
  name: string
  address: string
}

export {
  ITable,
  IPodpisant,
  ISvUchDocObor,
  IDocPodtvOtgr,
  ISvProd,
  ISvPokup,
  ISvChFact,
  IInvoice,
  IDocument,
  Organization,
  ICost,
  IProduct,
  IData,
  IServices,
}
