export const contentGen = (content) => {
  const div = document.createElement('div')
  div.innerHTML = content
  return div
  // document.body.appendChild(div)
}
