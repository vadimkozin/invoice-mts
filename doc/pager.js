import { EventEmitter } from 'node:events'

export class Pager extends EventEmitter {
  constructor({ heightPage = 280, startY = 0, stepY = 4 }) {
    super()
    this.heightPage = heightPage // размер по Y для перехода на новую страницу
    this.startY = startY // точка отсчёта по Y
    this.defaultStepY = stepY // приращение между строк по Y (по умолчанию)
    this.currentY = startY // текущий Y на странице
    this.lastY = startY //
    this.page = 1 // текущая страница
  }

  page() {
    return this.page
  }

  get y() {
    return this.currentY
  }

  get last() {
    return this.lastY
  }

  next(increment = null) {
    this.currentY += increment ? increment : this.defaultStepY
    this.lastY = this.currentY

    if (this.currentY >= this.heightPage + this.startY) {
      this.page += 1
      this.currentY = this.startY
      this.emit('newpage')
    }

    return this.currentY
  }
}
