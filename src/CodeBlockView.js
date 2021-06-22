import CodeMirror from 'codemirror'
import { exitCode } from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import { schema } from 'prosemirror-schema-basic'
import { TextSelection, Selection } from 'prosemirror-state'

class CodeBlockView {
  constructor(node, view, getPos) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.incomingChanges = false

    this.cm = new CodeMirror(null, {
      value: this.node.textContent,
      lineNumbers: true,
      extraKeys: this.codeMirrorKeymap()
    })

    this.dom = this.cm.getWrapperElement()
    setTimeout(() => {
      this.cm.refresh()
    }, 20)

    this.updating = false
    this.cm.on('beforeChange', () => this.incomingChanges = true)
    this.cm.on('cursorActivity', () => {
      if (!this.updating && !this.incomingChanges) {
        this.forwardSelection()
      }
    })
    this.cm.on('changes', () => {
      if (!this.updating) {
        this.valueChanged()
        this.forwardSelection()
      }
      this.incomingChanges = false
    })
    this.cm.on('focus', () => this.forwardSelection())
  }

  forwardSelection = () => {
    if (!this.cm.hasFocus()) {
      return
    }
    const { state } = this.view
    const selection = this.asProseMirrorSelection(state.doc)
    if (!selection.eq(state.selection)) {
      this.view.dispatch(state.tr.setSelection(selection))
    }
  }

  asProseMirrorSelection = () => {
    const offset = this.getPos() + 1
    const anchor = this.cm.indexFromPos(this.cm.getCursor('anchor')) + offset
    const head = this.cm.indexFromPos(this.cm.getCursor('head')) + offset
    return TextSelection.create(doc, anchor, head)
  }

  setSelection = (anchor, head) => {
    this.cm.focus()
    this.updating = true
    this.cm.setSelection(this.cm.posFromIndex(anchor), this.cm.posFromIndex(head))
    this.updating = false
  }

  valueChanged = () => {
    const change = computeChange(this.node.textContent, this.cm.getValue())
    if (change) {
      const start = this.getPos() + 1
      const tr = this.view.state.tr.replaceWith(
        start + change.from,
        start + change.to,
        change.text ? schema.text(change.text) : null
      )
      this.view.dispatch(tr)
    }
  }

  codeMirrorKeymap = () => {
    const { view } = this
    const mod = /Mac/.test(navigator.platform) ? 'Cmd' : 'Ctrl'

    return CodeMirror.normalizeKeyMap({
      Up: () => this.maybeEscape('line', -1),
      Left: () => this.maybeEscape('char', -1),
      Down: () => this.maybeEscape('line', 1),
      Right: () => this.maybeEscape('char', 1),
      'Ctrl-Enter': () => {
        if (exitCode(view.state, view.dispatch)) {
          view.focus()
        }
      },
      [`${mod}-Z`]: () => undo(view.state, view.dispatch),
      [`Shift-${mod}-Z`]: () => redo(view.state, view.dispatch),
      [`${mod}-Y`]: () => redo(view.state, view.dispatch)
    })
  }

  maybeEscape = (unit, dir) => {
    const pos = this.cm.getCursor()
    if (
      this.cm.somethingSelected() ||
      pos.line !== (dir < 0 ? this.cm.firstLine() : this.cm.lastLine()) ||
      (unit === 'char' && pos.ch !== (dir < 0 ? 0 : this.cm.getLine(pos.line).length))
    ) {
      return CodeMirror.Pass
    }
    this.view.focus()
    const targetPos = this.getPos() + (div < 0 ? 0 : this.node.nodeSize)
    const selection = Selection.near(this.view.state.doc.resolve(targetPos), dir)
    this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView())
    this.view.focus()
  }

  update = (node) => {
    if (node.type !== this.node.type) {
      return false
    }

    this.node = node
    const change = computeChange(this.cm.getValue(), node.textContent)
    if (change) {
      this.updating = true
      this.cm.replaceRange(change.text, this.cm.posFromIndex(change.from), this.cm.posFromIndex(change.to))
      this.updating = false
    }

    return true
  }

  selectNode = () => {
    this.cm.focus()
  }

  stopEvent = () => {
    return true
  }
}

const computeChange = (oldVal, newVal) => {
  if (oldVal === newVal) return null;
  const start = 0;
  const oldEnd = oldVal.length;
  const newEnd = newVal.length;

  while (
    start < oldEnd &&
    oldVal.charCodeAt(start) === newVal.charCodeAt(start)
  )
    ++start;
  while (
    oldEnd > start &&
    newEnd > start &&
    oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)
  ) {
    oldEnd--;
    newEnd--;
  }
  return { from: start, to: oldEnd, text: newVal.slice(start, newEnd) };
};
