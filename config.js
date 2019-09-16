function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve('chengdu')
    }

    navigator.geolocation.getCurrentPosition((position) => {
      resolve(position.coords.latitude + ':' + position.coords.longitude)
    })
  })
}

const _config_ = {
  weather: {
    // key: 'PCUv2FSkTZBUDcJCv',
    // secret: 'SUq-vYUmoASwudfYi',
    key: '',
    secret: '',
    // Latitude: longitude
    city: getLocation,
    // seconds
    updateRate: 30 * 60
  },
  calendar: {
    rx: 0,
    ry: 0
  }
}
