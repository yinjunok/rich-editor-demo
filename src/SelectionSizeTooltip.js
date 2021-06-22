export default class SelectionSizeTooltip {
  constructor(view) {
    this.tooltip = document.createElement('div')
    this.tooltip.className = 'tooltip'
    view.dom.parentNode.appendChild(this.tooltip)
    
    this.update(view, null)
  }

  update(view, lastState) {
    const { state } = view

    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    ) {
      return
    }

    if (state.selection.empty) {
      this.tooltip.style.display = 'none'
      return
    }

    this.tooltip.style.display = ''
    const { from, to } = state.selection
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    const box = this.tooltip.offsetParent.getBoundingClientRect()
    const left = Math.max((start.left + end.left) / 2, start.left + 3)
    this.tooltip.style.left = `${left - box.left}px`
    this.tooltip.style.bottom = `${box.bottom - start.top}px`
    this.tooltip.textContent = to - from
  }

  destroy() {
    this.tooltip.remove()
  }
}
