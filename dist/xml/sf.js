import { nanoid } from 'nanoid';
import { XMLBuilder } from 'fast-xml-parser';
import { mts, podpisant, parameters } from './constant.js';
import { date } from './date.js';
// возвращает идентификатор организации : ИННКПП
const getOrgId = (customer) => {
    let orgId = customer.inn;
    if (customer.kpp)
        orgId += customer.kpp;
    return orgId;
};
// возвращает номер документа, например, A-429
const getNumberDoc = (number) => `${parameters.PREFIX_DOC}${number}`;
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
const getFileName = ({ buyer, seller, }) => {
    const prefix = 'ON_NSCHFDOPPR';
    const _date = date.getCurrentDay();
    const uid = nanoid(36);
    // prettier-ignore
    const name = `${prefix}_${getOrgId(buyer)}_${getOrgId(seller)}_${_date}_${uid}`;
    return name;
};
// опции генератора XMLBuilder
const options = {
    ignoreAttributes: false,
    attributeNamePrefix: '@@',
    format: true,
    suppressEmptyNode: true,
};
/**
 * Получение СФ в XML формате
 * used:
 * const sf = new SchetFact({ buyer: customer1, seller: mts, data, invoice })
 * const { filename, xml } = await sf.getXml()
 */
class SchetFact {
    constructor({ buyer, seller, data, invoice }) {
        this.buyer = buyer;
        this.seller = seller;
        this.data = data;
        this.invoice = invoice;
        this.firstrow = '<?xml version="1.0" encoding="windows-1251"?>';
    }
    // возвращает {filename, xml}  - имя файла и СФ в xml-формате
    getXml() {
        const filename = getFileName({
            buyer: this.buyer,
            seller: this.seller,
        });
        const document = this._getDocument(filename);
        const builder = new XMLBuilder(options);
        const xml = builder.build(document);
        const ext = 'xml';
        return { filename: `${filename}.${ext}`, xml: `${this.firstrow}\n${xml}` };
    }
    // возвращает СФ в формате js-объекта c названиями полей по спецификации СФ в xml (префикс @@ -означает атрибут)
    _getDocument(filename) {
        return {
            Файл: {
                '@@ИдФайл': filename,
                '@@ВерсПрог': parameters.VERSION_PROG,
                '@@ВерсФорм': parameters.VERSION_FORM,
                СвУчДокОбор: this._getSvUchDocObor(),
                Документ: {
                    '@@КНД': parameters.KND,
                    '@@Функция': 'СЧФ',
                    '@@ДатаИнфПр': date.getDateCreateFile(),
                    '@@ВремИнфПр': date.getTimeCreateFile(),
                    '@@НаимЭконСубСост': mts.name,
                    СвСчФакт: this._getSvChetFact(),
                    ТаблСчФакт: this._getTableSf(this.data),
                    Подписант: this._getPodpisant(),
                },
            },
        };
    }
    // Таблица СФ - товары(услуги) и общая стоимость
    _getTableSf(services) {
        const products = services.items.map((s, i) => {
            // номера колонок по существующей бумажной СФ
            return {
                '@@НомСтр': i + 1,
                '@@НаимТов': parameters.servCodeToTextMap[s.servType],
                '@@ОКЕИ_Тов': parameters.OKEI,
                '@@КолТов': 1,
                '@@ЦенаТов': s.cost.raw,
                '@@СтТовБезНДС': s.cost.raw,
                '@@НалСт': `${parameters.NDS_20}%`,
                '@@СтТовУчНал': s.cost.full,
                Акциз: { БезАкциз: parameters.NOAKCIZ },
                СумНал: { СумНал: s.cost.nds },
                ДопСведТов: { '@@НаимЕдИзм': parameters.OKEI_NAME }, // единицы измерения (колонка 2a)
            };
        });
        const totalCost = {
            '@@СтТовБезНДСВсего': services.total.raw,
            '@@СтТовУчНалВсего': services.total.full,
            СумНалВсего: {
                СумНал: services.total.nds, // итого стоимость НДС (колонка 8)
            },
        };
        return {
            СведТов: products,
            ВсегоОпл: totalCost,
        };
    }
    // Подписант
    _getPodpisant() {
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
        };
    }
    // Сведения об участниках электронного документооборота
    _getSvUchDocObor() {
        return {
            '@@ИдОтпр': getOrgId(this.seller),
            '@@ИдПол': getOrgId(this.buyer),
        };
    }
    // Сведения о продавце ISvProd
    _getSvProd() {
        return {
            '@@КраткНазв': mts.nameShort,
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
        };
    }
    // из названия ИП возвращает: {fam,name,ot}
    _parceNameOnFio(name) {
        const needDelete = ['индивидуальный', 'предприниматель', '(ип)', 'ип'];
        const words = name.replace(/\s+/g, ' ').trim().split(' ');
        const rest = words.filter((w) => !needDelete.includes(w.toLowerCase()));
        if (rest.length === 3) {
            return {
                fam: rest[0],
                name: rest[1],
                ot: rest[2],
            };
        }
        else {
            return {
                fam: rest.join(' '),
                name: '',
                ot: '',
            };
        }
    }
    // Идентификационные сведения: ИдСв
    _getIdSv() {
        const typeOrg = this.buyer.type; // u | f | ip // vadim
        switch (this.buyer.type) {
            case 'ip': // Сведения об индивидуальном предпринимателе (ИП)
                const fio = this._parceNameOnFio(this.buyer.name);
                return {
                    СвИП: {
                        '@@ИННФЛ': this.buyer.inn,
                        ФИО: {
                            '@@Фамилия': fio.fam,
                            '@@Имя': fio.name,
                            '@@Отчество': fio.ot,
                        },
                    },
                };
            default: // Сведения о юридическом лице, состоящем на учете в налоговых органах
                return {
                    СвЮЛУч: {
                        // Сведения об организации
                        '@@НаимОрг': this.buyer.name,
                        '@@ИННЮЛ': this.buyer.inn,
                        '@@КПП': this.buyer.kpp,
                    },
                };
        }
    }
    // Сведения о покупателе: ISvPokup
    _getSvPokup() {
        return {
            '@@КраткНазв': this.buyer.name,
            // ИдСв: {
            //   СвЮЛУч: {
            //     // Сведения об организации
            //     '@@НаимОрг': this.buyer.name,
            //     '@@ИННЮЛ': this.buyer.inn,
            //     '@@КПП': this.buyer.kpp,
            //   },
            // },
            ИдСв: this._getIdSv(),
            Адрес: {
                АдрИнф: {
                    '@@КодСтр': parameters.ROSSIA,
                    '@@АдрТекст': this.buyer.address,
                },
            },
        };
    }
    // Реквизиты документа, подтверждающего отгрузку: IDocPodtvOtgr
    _getDocPodtvOtgr() {
        return {
            '@@НаимДокОтгр': '-',
            '@@НомДокОтгр': getNumberDoc(this.invoice.num),
            '@@ДатаДокОтгр': date.getDate(this.invoice.date), //'31.01.2023'
        };
    }
    // Сведения по Счёт-фактуре
    _getSvChetFact() {
        return {
            '@@НомерСчФ': getNumberDoc(this.invoice.num),
            '@@ДатаСчФ': date.getDate(this.invoice.date),
            '@@КодОКВ': parameters.OKB,
            СвПрод: this._getSvProd(),
            СвПокуп: this._getSvPokup(),
            ДокПодтвОтгр: this._getDocPodtvOtgr(),
        };
    }
}
export { SchetFact };
