import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { MenuItem } from 'prosemirror-menu'
import { exampleSetup, buildMenuItems } from "prosemirror-example-setup";
import 'prosemirror-view/style/prosemirror.css'
import 'prosemirror-menu/style/menu.css'
import './style.css'
import init from './init'

init()

/*
  isBlock, isInline 标识这个节点是块级, 还是行内
  inlineContent 如果是 true, 标识该节点只能接受 inline 元素作为 content
  isTextBlock 如果是 true, 包含 inline content 的 block nodes
  isLeaf 表示该 node 不允许含有任何内容
*/

const timeNodeSpec = {
  attrs: {
    datetime: {
      default: new Date().toUTCString()
    }
  },
  inline: true,
  group: 'inline',
  draggable: true,
  text: 'abc',
  toDOM: node => [
    'time',
    {
      datetime: node.attrs.datetime,
      style: 'color: red'
    },
    node.attrs.datetime
  ],
  parseDOM: [
    {
      tag: 'time[datetime]',
      getAttrs: dom => {
        return dom.getAttribute('datetime')
      }
    }
  ]
}

const timeSchema = new Schema({
  nodes: schema.spec.nodes.addBefore('time', 'time', timeNodeSpec),
  marks: schema.spec.marks
})

const timeType = timeSchema.nodes.time
const insertTime = time => {
  return (state, dispatch) => {
    const { $from } = state.selection
    const index = $from.index()
    if (!$from.parent.canReplaceWith(index, index, timeType)) {
      return false
    }
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(timeType.create({ time })))
    }
    return true
  }
}

const menu = buildMenuItems(timeSchema)
menu.insertMenu.content.push(new MenuItem({
  title: `Insert Time`,
  label: 'Time',
  enable(state) {
    return insertTime(new Date().toString())(state)
  },
  run: insertTime(new Date().toString())
}))

window.view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    doc: DOMParser.fromSchema(timeSchema).parse(
      document.querySelector("#content")
    ),
    plugins: exampleSetup({ schema: timeSchema, menuContent: menu.fullMenu }),
  }),
});
