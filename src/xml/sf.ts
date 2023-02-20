import { nanoid } from 'nanoid/async'
import { XMLBuilder } from 'fast-xml-parser'
import { mts, podpisant, parameters } from './constant'
import {
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
  IServices,
} from './types-sf'

// возвращает идентификатор организации : ИННКПП
const getOrgId = (customer: Organization) => `${customer.inn}${customer.kpp}`

// дополняет нулём слева до 2-х цифр
const pad = (num: number | string, max: number = 2) =>
  num.toString().padStart(max, '0')

// возвращает текущий день в формате YYYYMMDD
const getCurrentDay = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1)
  const day = pad(now.getDate())

  return `${year}${month}${day}`
}

// возвращает Дату в формате dd.mm.yyyy
const getDate = (date: Date) => {
  const dt = new Date(date)
  const year = dt.getFullYear()
  const month = pad(dt.getMonth() + 1)
  const day = pad(dt.getDate())

  return `${day}.${month}.${year}`
}

// Дата формирования файла обмена в формате dd.mm.yyyy
const getDateCreateFile = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1)
  const day = pad(now.getDate())

  return `${day}.${month}.${year}`
}

// Время формирования файла обмена HH.MM.SS
const getTimeCreateFile = () => {
  const now = new Date()
  const hours = pad(now.getHours())
  const minutes = pad(now.getMinutes())
  const seconds = pad(now.getSeconds())

  return `${hours}.${minutes}.${seconds}`
}

/*
Возвращает название файла СФ:

пример:
ON_NSCHFDOPPR_7712007390774301001_7740000076997750001_20230215_813b05ec-abc3-4e3b-89af-0936493047f2.xml

ON_NSCHFDOPPR       - префикс
7712007390774301001 - ИНН+КПП Северного порта (покупателя)
7740000076997750001 - ИНН+КПП МТС (продавца)
20230215            - 2023 02 15 (15-02-2023) дата формирования документа
813b05ec-abc3-4e3b-89af-0936493047f2  - уникальный id (36 символов)
*/
const getFileName = async ({
  buyer,
  seller,
}: {
  buyer: Organization
  seller: Organization
}): Promise<string> => {
  const prefix = 'ON_NSCHFDOPPR'
  const date = getCurrentDay()
  const uid = await nanoid(36)
  const name = `${prefix}_${getOrgId(seller)}_${getOrgId(buyer)}_${date}_${uid}`

  return name
}

// опции генератора XMLBuilder
const options = {
  ignoreAttributes: false,
  attributeNamePrefix: '@@',
  format: true,
  suppressEmptyNode: true,
}

// СФ целиком
type ISchetFact = {
  buyer: Organization
  seller: Organization
  services: IServices
  invoice: IInvoice
}

/**
 * Получение СФ в XML формате
  used:
  const sf = new SchetFact({ buyer: customer1, seller: mts, services, invoice })
  const { filename, xml } = await sf.getXml()
 */
class SchetFact {
  buyer: Organization // покупатель
  seller: Organization // продавец
  services: IServices // услуги со стоимостью
  invoice: IInvoice // параметры СФ

  constructor({ buyer, seller, services, invoice }: ISchetFact) {
    this.buyer = buyer
    this.seller = seller
    this.services = services
    this.invoice = invoice
  }

  // возвращает {filename, xml}  - имя файла и СФ в xml-формате
  async getXml(): Promise<{ filename: string; xml: string }> {
    const filename = await getFileName({
      buyer: this.buyer,
      seller: this.seller,
    })

    const document = this._getDocument(filename)

    const builder = new XMLBuilder(options)

    const xml = builder.build(document)

    return { filename, xml }
  }

  // возвращает СФ в формате js-объекта c названиями полей по спецификации СФ в xml (префикс @@ -означает атрибут)
  _getDocument(filename: string): IDocument {
    return {
      Файл: {
        '@@ИдФайл': filename,
        '@@ВерсПрог': parameters.VERSION_PROG,
        '@@ВерсФорм': parameters.VERSION_FORM,
        СвУчДокОбор: this._getSvUchDocObor(),
        Документ: {
          '@@КНД': parameters.KND,
          '@@Функция': 'СЧФ',
          '@@ДатаИнфПр': getDateCreateFile(),
          '@@ВремИнфПр': getTimeCreateFile(),
          '@@НаимЭконСубСост': mts.name,
          СвСчФакт: this._getSvChetFact(),
          ТаблСчФакт: this._getTableSf(this.services),
          Подписант: this._getPodpisant(),
        },
      },
    }
  }

  // Таблица СФ - товары(услуги) и общая стоимость
  _getTableSf(services: IServices): ITable {
    const products = services.items.map((s, i) => {
      // номера колонок по существующей бумажной СФ
      return {
        '@@НомСтр': i + 1, // номер строки в таблице (колонка 1)
        '@@НаимТов': parameters.servCodeToTextMap[s.servType], // наименование товара(услуги) (колонка 1а)
        '@@ОКЕИ_Тов': parameters.OKEI, // код товара по ОКЕИ (362) (колонка 2)
        '@@КолТов': 1, // количество товаров ( колонка 3)
        '@@ЦенаТов': s.cost.raw, // цена(тариф) за единицу измерения (колонка 4)
        '@@СтТовБезНДС': s.cost.raw, // колонка 5
        '@@НалСт': `${parameters.NDS_20}%`, // колонка 7
        '@@СтТовУчНал': s.cost.full, // стоимость с налогом (колонка 9)
        Акциз: { БезАкциз: parameters.NOAKCIZ }, // сумма акциза (колонка 6)
        СумНал: { СумНал: s.cost.nds }, // сумма налога (колонка 8)
        ДопСведТов: { '@@НаимЕдИзм': parameters.OKEI_NAME }, // единицы измерения (колонка 2a)
      }
    })

    const totalCost = {
      '@@СтТовБезНДСВсего': services.total.raw, // итого стоимость товаров без НДС (колонка 5)
      '@@СтТовУчНалВсего': services.total.full, // итого стоимость товаров с НДС ( колонка 9)
      СумНалВсего: {
        СумНал: services.total.nds, // итого стоимость НДС (колонка 8)
      },
    }

    return {
      СведТов: products,
      ВсегоОпл: totalCost,
    }
  }
  // Таблица СФ
  _getTableSf___old(): ITable {
    return {
      СведТов: [
        {
          '@@НомСтр': 1,
          '@@НаимТов': parameters.servCodeToTextMap.VZ,
          '@@ОКЕИ_Тов': parameters.OKEI,
          '@@КолТов': 1,
          '@@ЦенаТов': 487.2,
          '@@СтТовБезНДС': 487.2,
          '@@НалСт': `${parameters.NDS_20}%`,
          '@@СтТовУчНал': 584.64,
          Акциз: { БезАкциз: parameters.NOAKCIZ },
          СумНал: { СумНал: 97.44 },
          ДопСведТов: { '@@НаимЕдИзм': parameters.OKEI_NAME },
        },
        {
          '@@НомСтр': 2,
          '@@НаимТов': parameters.servCodeToTextMap.MG,
          '@@ОКЕИ_Тов': parameters.OKEI,
          '@@КолТов': 1,
          '@@ЦенаТов': 4.2,
          '@@СтТовБезНДС': 4.2,
          '@@НалСт': `${parameters.NDS_20}%`,
          '@@СтТовУчНал': 5.04,
          Акциз: { БезАкциз: parameters.NOAKCIZ },
          СумНал: { СумНал: 0.84 },
          ДопСведТов: { '@@НаимЕдИзм': parameters.OKEI_NAME },
        },
      ],
      ВсегоОпл: {
        '@@СтТовБезНДСВсего': 491.4,
        '@@СтТовУчНалВсего': 589.68,
        СумНалВсего: {
          СумНал: 98.28,
        },
      },
    }
  }

  // Подписант
  _getPodpisant(): IPodpisant {
    return {
      '@@ОблПолн': '5',
      '@@Статус': '1',
      '@@ОснПолн': 'Должностные обязанности',
      ЮЛ: {
        '@@ИННЮЛ': mts.inn,
        '@@НаимОрг': mts.name,
        '@@Должн': podpisant.position,
        ФИО: {
          '@@Фамилия': podpisant.fio.fam,
          '@@Имя': podpisant.fio.name,
          '@@Отчество': podpisant.fio.ot,
        },
      },
    }
  }

  // Сведения об участниках электронного документооборота
  _getSvUchDocObor(): ISvUchDocObor {
    return {
      '@@ИдОтпр': getOrgId(this.seller),
      '@@ИдПол': getOrgId(this.buyer),
    }
  }

  // Сведения о продавце ISvProd
  _getSvProd(): ISvProd {
    return {
      '@@КраткНазв': mts.name,
      ИдСв: {
        СвЮЛУч: {
          '@@НаимОрг': mts.name,
          '@@ИННЮЛ': mts.inn,
          '@@КПП': mts.kpp,
        },
      },
      Адрес: {
        АдрИнф: {
          '@@КодСтр': parameters.ROSSIA,
          '@@АдрТекст': mts.address,
        },
      },
    }
  }

  // Сведения о покупателе ISvPokup
  _getSvPokup(): ISvPokup {
    return {
      '@@КраткНазв': this.buyer.name,
      ИдСв: {
        СвЮЛУч: {
          '@@НаимОрг': this.buyer.name,
          '@@ИННЮЛ': this.buyer.inn,
          '@@КПП': this.buyer.kpp,
        },
      },
      Адрес: {
        АдрИнф: {
          '@@КодСтр': parameters.ROSSIA,
          '@@АдрТекст': this.buyer.address,
        },
      },
    }
  }

  // Реквизиты документа, подтверждающего отгрузку IDocPodtvOtgr
  _getDocPodtvOtgr(): IDocPodtvOtgr {
    return {
      '@@НаимДокОтгр': '-',
      '@@НомДокОтгр': this.invoice.num,
      '@@ДатаДокОтгр': getDate(this.invoice.date), //'31.01.2023'
    }
  }

  // Сведения по Счёт-фактуре
  _getSvChetFact(): ISvChFact {
    return {
      '@@НомерСчФ': this.invoice.num,
      '@@ДатаСчФ': getDate(this.invoice.date),
      '@@КодОКВ': parameters.OKB,
      СвПрод: this._getSvProd(),
      СвПокуп: this._getSvPokup(),
      ДокПодтвОтгр: this._getDocPodtvOtgr(),
    }
  }
}

export { SchetFact, ISchetFact }
