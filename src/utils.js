export const contentGen = (content) => {
  const div = document.createElement('div')
  div.innerHTML = content
  return div
  // document.body.appendChild(div)
}

export const uploadFile = (file) => {
  let reader = new FileReader
  return new Promise((accept, fail) => {
    reader.onload = () => accept(reader.result)
    reader.onerror = () => fail(reader.error)
    // Some extra delay to make the asynchronicity visible
    setTimeout(() => reader.readAsDataURL(file), 100)
  })
}