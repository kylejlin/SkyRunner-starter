import { Howl } from 'howler'

const loadJSON = url => {
  return fetch(url).then(response => response.json()).then(json => {
    return json
  })
}

const loadImage = url => {
  const image = new Image()
  image.src = url
  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => {
      resolve(image)
    })
    image.addEventListener('error', error => {
      reject(error)
    })
    image.addEventListener('abort', error => {
      reject(error)
    })
  })
}

const loadAudio = url => {
  return new Promise((resolve, reject) => {
    const sound = new Howl({
      src: [url],
      onload: () => {
        resolve(sound)
      },
      onloaderror: (id, error) => {
        reject(error)
      },
      onplayerror: (id, error) => {
        reject(error)
      }
    })
  })
}

export {
  loadJSON,
  loadImage,
  loadAudio
}
