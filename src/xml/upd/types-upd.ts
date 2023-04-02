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

// ФИО для xml
interface IFio {
  '@@Фамилия': string
  '@@Имя': string
  '@@Отчество': string
}

// ФИО в чистом виде
interface IFioRaw {
  name: string
  fam: string
  ot: string
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
    ФИО: IFio
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
  '@@ОКПО'?: string
  ИдСв: {
    СвЮЛУч: { '@@НаимОрг': string; '@@ИННЮЛ': string; '@@КПП': string }
  }
  Адрес: {
    АдрИнф: { '@@КодСтр': string; '@@АдрТекст': string }
  }
}

// СвПокуп : Сведения покупателя
//
interface ISvPokup {
  '@@КраткНазв': string
  // ИдСв: {
  //   СвЮЛУч: { '@@НаимОрг': string; '@@ИННЮЛ': string; '@@КПП': string }
  // }
  ИдСв: ISvUlUch | ISvIP
  Адрес: {
    АдрИнф: { '@@КодСтр': string; '@@АдрТекст': string }
  }
}

// СвПродПер : Содержание факта хозяйственной жизни 3 – сведения о факте отгрузки товаров (выполнения работ), передачи имущественных прав (о предъявлении оказанных услуг) (СвПродПер)
//
interface ISvProdPer {
  СвПер: {
    '@@СодОпер': string
    ОснПер: {
      '@@НаимОсн': string
      '@@НомОсн': string
      '@@ДатаОсн': string
    }
  }
}

//
//IDopSvFhj1
interface IDopSvFhj1 {
  '@@НаимОКВ': string
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
      '@@ПоФактХЖ': string
      '@@НаимДокОпр': string
      СвСчФакт: {
        '@@НомерСчФ': string
        '@@ДатаСчФ': string
        '@@КодОКВ': string
        СвПрод: ISvProd
        СвПокуп: ISvPokup
        ДопСвФХЖ1: IDopSvFhj1
        ДокПодтвОтгр: IDocPodtvOtgr
      }
      ТаблСчФакт: ITable
      СвПродПер: ISvProdPer
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
  ДопСвФХЖ1: IDopSvFhj1
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

// один элемент данных ( одна услуга ) в таблице СФ
interface IDataItem {
  servType: string
  cost: ICost
}

// данные (список услуг) в таблице СФ
interface IData {
  items: IDataItem[]
  total: ICost
}

type TypeOrganization = 'u' | 'f' | 'ip' // ЮЛ | ФЛ | ИП

// buyer and seller - покупатель и продавец
interface Organization {
  inn: string
  kpp: string
  name: string
  nameShort: string
  address: string
  type: string // TypeOrganization
  dogovor?: {
    number: string
    date: string
  }
}

// СвЮЛУч: Сведения о юридическом лице, состоящем на учете в налоговых органах
interface ISvUlUch {
  СвЮЛУч: {
    '@@НаимОрг': string
    '@@ИННЮЛ': string
    '@@КПП': string
  }
}
// СвИП: Сведения об индивидуальном предпринимателе (ИП)
interface ISvIP {
  СвИП: {
    '@@ИННФЛ': string
    ФИО: IFio
  }
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
  IData,
  ISvUlUch,
  ISvIP,
  IFioRaw,
  ISvProdPer,
  IDopSvFhj1,
}
