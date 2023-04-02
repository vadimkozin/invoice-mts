import { nanoid } from 'nanoid'
import { XMLBuilder } from 'fast-xml-parser'
import { mts, podpisant, parameters } from './constant.js'
import { date } from './date.js'
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
  IData,
  ISvUlUch,
  ISvIP,
  IFioRaw,
  ISvProdPer,
  IDopSvFhj1,
} from './types-upd'

// возвращает идентификатор организации : ИННКПП
const getOrgId = (customer: Organization) => {
  let orgId = customer.inn
  if (customer.kpp) orgId += customer.kpp
  return orgId
}

// возвращает номер документа c префиксом, например, A-429
const getNumberDoc = (number: string) => {
  return number.startsWith(parameters.PREFIX_DOC) ? number : `${parameters.PREFIX_DOC}${number}`
}

// заменяет двойные кавычки на: &quot;
const replaceQuotationMarks = (value: string) => {
  return value.replace(/\"/g, '&quot;').trim()
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
const getFileName = ({ buyer, seller }: { buyer: Organization; seller: Organization }): string => {
  const prefix = 'ON_NSCHFDOPPR'
  const _date = date.getCurrentDay()
  const uid = nanoid(36)
  // prettier-ignore
  const name = `${prefix}_${getOrgId(buyer)}_${getOrgId(seller)}_${_date}_${uid}`

  return name
}

// опции генератора XMLBuilder
const options = {
  ignoreAttributes: false,
  attributeNamePrefix: '@@',
  format: true,
  suppressEmptyNode: true,
}

// СФ
type IUpd = {
  buyer: Organization
  seller: Organization
  data: IData
  invoice: IInvoice
}

/**
 * Получение УПД в XML формате
 * used:
 * const sf = new Upd({ buyer: customer1, seller: mts, data, invoice })
 * const { filename, xml } = await sf.getXml()
 */
class Upd {
  buyer: Organization // покупатель
  seller: Organization // продавец
  data: IData // услуги со стоимостью
  invoice: IInvoice // параметры СФ
  firstrow: string // первая сторка в файле xml

  constructor({ buyer, seller, data, invoice }: IUpd) {
    this.buyer = buyer
    this.seller = seller
    this.data = data
    this.invoice = invoice
    this.firstrow = '<?xml version="1.0" encoding="windows-1251"?>'
  }

  // возвращает {filename, xml}  - имя файла и СФ в xml-формате
  getXml(): { filename: string; xml: string } {
    const filename = getFileName({
      buyer: this.buyer,
      seller: this.seller,
    })

    const document = this._getDocument(filename)

    const builder = new XMLBuilder(options)

    const xml = builder.build(document)

    const ext = 'xml'

    return { filename: `${filename}.${ext}`, xml: `${this.firstrow}\n${xml}` }
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
          '@@Функция': parameters.FUNCTION,
          '@@ДатаИнфПр': date.getDateCreateFile(),
          '@@ВремИнфПр': date.getTimeCreateFile(),
          '@@НаимЭконСубСост': this._getNameEkonSubSost(),
          '@@ПоФактХЖ': parameters.PO_FACT_HJ,
          '@@НаимДокОпр': parameters.NAME_DOC_OTPR,
          СвСчФакт: this._getSvChetFact(),
          ТаблСчФакт: this._getTableSf(this.data),
          СвПродПер: this._getSvProdPer(),
          Подписант: this._getPodpisant(),
        },
      },
    }
  }

  // возвращает: СвПродПер
  _getSvProdPer(): ISvProdPer {
    return {
      СвПер: {
        '@@СодОпер': parameters.SOD_OPER,
        ОснПер: {
          '@@НаимОсн': 'Договор',
          '@@НомОсн': '№ ' + this.buyer.dogovor.number,
          '@@ДатаОсн': date.translateDate(this.buyer.dogovor.date),
        },
      },
    }
  }
  // возвращает: НаимЭконСубСост - название продавца + ИНН/КПП продавца
  _getNameEkonSubSost(): string {
    const innkpp = `ИНН/КПП: ${this.seller.inn}/${this.seller.kpp}`
    const name = replaceQuotationMarks(this.seller.name)
    return `${name}, ${innkpp}`
  }

  // Таблица СФ - товары(услуги) и общая стоимость
  _getTableSf(services: IData): ITable {
    const products = services.items.map((s, i) => {
      // console.log(s, parameters.servCodeToTextMap[s.servType])

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
      '@@КраткНазв': mts.nameShort,
      '@@ОКПО': mts.okpo,
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

  _getDopSvFhj1(): IDopSvFhj1 {
    return {
      '@@НаимОКВ': parameters.NAME_OKB,
    }
  }

  // из названия ИП возвращает: {fam,name,ot}
  _parceNameOnFio(name: string): IFioRaw {
    const needDelete = ['индивидуальный', 'предприниматель', '(ип)', 'ип']
    const words = name.replace(/\s+/g, ' ').trim().split(' ')

    const rest = words.filter((w) => !needDelete.includes(w.toLowerCase()))
    if (rest.length === 3) {
      return {
        fam: rest[0],
        name: rest[1],
        ot: rest[2],
      }
    } else {
      return {
        fam: rest.join(' '),
        name: '',
        ot: '',
      }
    }
  }

  // Идентификационные сведения: ИдСв
  _getIdSv(): ISvUlUch | ISvIP {
    const typeOrg = this.buyer.type // u | f | ip // vadim

    switch (this.buyer.type) {
      case 'ip': // Сведения об индивидуальном предпринимателе (ИП)
        const fio = this._parceNameOnFio(this.buyer.name)
        // console.log(`fio::::`, fio)
        return {
          СвИП: {
            '@@ИННФЛ': this.buyer.inn,
            ФИО: {
              '@@Фамилия': fio.fam,
              '@@Имя': fio.name,
              '@@Отчество': fio.ot,
            },
          },
        }
      default: // Сведения о юридическом лице, состоящем на учете в налоговых органах
        return {
          СвЮЛУч: {
            // Сведения об организации
            '@@НаимОрг': this.buyer.name,
            '@@ИННЮЛ': this.buyer.inn,
            '@@КПП': this.buyer.kpp,
          },
        }
    }
  }

  // Сведения о покупателе: ISvPokup
  _getSvPokup(): ISvPokup {
    return {
      '@@КраткНазв': this.buyer.nameShort,
      ИдСв: this._getIdSv(),
      Адрес: {
        АдрИнф: {
          '@@КодСтр': parameters.ROSSIA,
          '@@АдрТекст': this.buyer.address,
        },
      },
    }
  }

  // Реквизиты документа, подтверждающего отгрузку: IDocPodtvOtgr
  _getDocPodtvOtgr(): IDocPodtvOtgr {
    return {
      '@@НаимДокОтгр': parameters.NAME_DOC_OTGR,
      '@@НомДокОтгр': getNumberDoc(this.invoice.num), // A-429
      '@@ДатаДокОтгр': date.getDate(this.invoice.date), //'31.01.2023'
    }
  }

  // Сведения по Счёт-фактуре
  _getSvChetFact(): ISvChFact {
    return {
      '@@НомерСчФ': getNumberDoc(this.invoice.num),
      '@@ДатаСчФ': date.getDate(this.invoice.date),
      '@@КодОКВ': parameters.OKB,
      СвПрод: this._getSvProd(),
      СвПокуп: this._getSvPokup(),
      ДопСвФХЖ1: this._getDopSvFhj1(),
      ДокПодтвОтгр: this._getDocPodtvOtgr(),
    }
  }
}

export { Upd, IUpd }
