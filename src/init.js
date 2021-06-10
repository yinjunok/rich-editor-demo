export default () => {
  const editor = document.createElement('div')
  editor.id = 'editor'
  document.body.appendChild(editor)
  const content = document.createElement('div')
  content.id = 'content'
  document.body.appendChild(content)
}
