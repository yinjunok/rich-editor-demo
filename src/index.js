import { schema } from 'prosemirror-schema-basic'
import { Schema, Fragment, DOMParser } from 'prosemirror-model'
import { StepMap, insertPoint } from 'prosemirror-transform'
import { keymap } from 'prosemirror-keymap'
import { MenuItem } from "prosemirror-menu"
import { buildMenuItems } from "prosemirror-example-setup"
import { undo, redo } from 'prosemirror-history'
import { EditorView } from 'prosemirror-view'
import { exampleSetup } from 'prosemirror-example-setup'
import { EditorState } from 'prosemirror-state'
import 'prosemirror-view/style/prosemirror.css'
import 'prosemirror-menu/style/menu.css'
import init from './init'
import './style.css'

init()

const footnoteSpec = {
  group: 'inline',
  content: 'inline*',
  inline: true,
  atom: true,
  toDom: () => ['footnote', 0],
  parseDOM: [{ tag: 'footnote' }],
}

const footnoteSchema = new Schema({
  nodes: schema.spec.nodes.addBefore('image', 'footnote', footnoteSpec),
  marks: schema.spec.marks,
})

class FootnoteView {
  constructor(note, view, getPos) {
    this.node = this.node
    this.outerView = view
    this.getPos = getPos
    
    this.dom = document.createElement('footnote')
    this.innerView = null
  }

  selectNode = () => {
    this.dom.classList.add('ProseMirror-selectednode')
    if (!this.innerView) {
      return this.open()
    }
  }

  deselectNode = () => {
    this.dom.classList.remove('ProseMirror-selectednode')
    if (this.innerView) {
      this.close()
    }
  }

  open = () => {
    const tooltip = this.dom.appendChild(document.createElement('div'))
    tooltip.classList.add('footnote-tooltip')
    this.innerView = new EditorView(tooltip, {
      state: EditorState.create({
        doc: this.node,
        plugins: [
          keymap({
            'Mod-z': () => undo(this.outerView.state, this.outerView.dispatch),
            'Mod-y': () => redo(this.outerView.state, this.outerView.dispatch)
          })
        ]
      }),
      dispatchTransaction: this.dispatchInner.bind(this),
      handleDOMEvents: {
        mousedown: () => {
          if (this.outerView.hasFocus()) {
            this.innerView.focus()
          }
        }
      }
    })
  }

  close = () => {
    this.innerView.destroy()
    this.innerView = null
    this.dom.textContent = ''
  }

  dispatchInner = (tr) => {
    const { state, transactions } = this.innerView.state.applyTransaction(tr)
    this.innerView.updateState(state)

    if (!tr.getMeta('fromOutside')) {
      const outerTr = this.outerView.state.tr
      const offsetMap = StepMap.offset(this.getPos() + 1)
      for (let i = 0; i < transactions.length; i += 1) {
        const steps = transactions[i].steps
        for (let j = 0; j < steps.length; j += 1) {
          outerTr.step(steps[j].map(offsetMap))
        }
        if (outerTr.docChanged) {
          this.outerView.dispatch(outerTr)
        }
      }
    }
  }

  update = (node) => {
    if (!node.sameMarkup(this.node)) {
      return false
    }

    this.node = node
    if (this.innerView) {
      const state = this.innerView.state
      const start = node.content.findDiffStart(state.doc.content)
      if (start !== null) {
        const { a: endA, b: endB } = node.content.findDiffEnd(state.doc.content)
        const overlap = start - Math.min(endA, endB)
        if (overlap > 0) {
          endA += overlap
          endB += overlap
        }
        this.innerView.dispatch(
          state.tr.replace(start, endB, node.slice(start, endA)).setMeta('fromOutside', true)
        )
      }
    }
    return true
  }

  destroy = () => {
    if (this.innerView) {
      this.close()
    }
  }

  stopEvent = (event) => {
    return this.innerView && this.innerView.dom.contains(event.target)
  }

  ignoreMutation = () => {
    return true
  }
}

let menu = buildMenuItems(footnoteSchema)
menu.insertMenu.content.push(new MenuItem({
  title: "Insert footnote",
  label: "Footnote",
  select(state) {
    return insertPoint(state.doc, state.selection.from, footnoteSchema.nodes.footnote) != null
  },
  run(state, dispatch) {
    let {empty, $from, $to} = state.selection, content = Fragment.empty
    if (!empty && $from.sameParent($to) && $from.parent.inlineContent)
      content = $from.parent.content.cut($from.parentOffset, $to.parentOffset)
    dispatch(state.tr.replaceSelectionWith(footnoteSchema.nodes.footnote.create(null, content)))
  }
}))

window.view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(schema).parse(document.querySelector("#content")),
    plugins: exampleSetup({ schema: footnoteSchema, menuContent: menu.fullMenu }),
  }),
  dispatchTransaction(transaction) {
    const newState = view.state.apply(transaction)
    console.log(newState.selection.content())
    view.updateState(newState)
  }
});

