import path from 'node:path';
import fs from 'fs-extra';
const { ensureDirSync, appendFileSync } = fs;
export class Logging {
    constructor(filename) {
        this.filename = filename;
        ensureDirSync(path.dirname(filename));
    }
    add(message, outConsole = false) {
        if (outConsole) {
            console.log(message);
        }
        const txt = `${this._getDate()} ${message}\n`;
        appendFileSync(this.filename, txt);
    }
    _getDate() {
        const addz = (value) => String(value).padStart(2, '0'); // 7 -> '07'
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = addz(today.getMonth() + 1);
        const dd = addz(today.getDate());
        const hh = addz(today.getHours());
        const nn = addz(today.getMinutes());
        const ss = addz(today.getSeconds());
        return `${yyyy}-${mm}-${dd} ${hh}:${nn}:${ss}`;
    }
}
