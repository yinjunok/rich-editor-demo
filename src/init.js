export default () => {
  const content = `
    <div id='editor'></div>
    <div id='content'></div>
  `

  document.body.insertAdjacentHTML('beforeend', content)
}
