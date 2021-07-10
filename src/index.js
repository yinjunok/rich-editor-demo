import { DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { EditorView } from 'prosemirror-view'
import { exampleSetup } from 'prosemirror-example-setup'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import 'prosemirror-view/style/prosemirror.css'
import 'prosemirror-menu/style/menu.css'
import init from './init'
import './style.css'

init()

const myPlugin = new Plugin({
  key: new PluginKey('keydownReponse'),
  state: {},
  props: {
    handleDrop(_, e, slice, moved) {
      console.log(e, slice, moved)
    }
  }
})

window.view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(schema).parse(document.querySelector("#content")),
    plugins: exampleSetup({ schema }),
  }),
  dispatchTransaction(transaction) {
    const newState = view.state.apply(transaction)
    // console.log(newState.selection)
    view.updateState(newState)
  }
});

