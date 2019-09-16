;(() => {
  class Seniverse {
    // https://github.com/seanhuai/seniverse-jsonp
    constructor(uid, key, options) {
      const url = 'https://api.seniverse.com/v3/'
      const apitypes = {
        weather: {
          now: 'weather/now.json?',
          grid_now: 'weather/grid/now.json?',
          grid_minutely: 'weather/grid/minutely.json?',
          daily: 'weather/daily.json?',
          hourly: 'weather/hourly.json?',
          hourly_history: 'weather/hourly_history.json?',
          hourly3h: 'weather/hourly3h.json?',
          alarm: 'weather/alarm.json?'
        }
      }
      const defaultOptions = {
        api: 'now',
        language: 'zh-Hans',
        location: 'chengdu',
        ttl: 1800,
        unit: 'c',
        callback: 'showData'
      }
      for (let option in defaultOptions) {
        if (defaultOptions.hasOwnProperty(option) && !options.hasOwnProperty(option)) {
          options[option] = defaultOptions[option]
        }
      }

      this.uid = uid || ''
      this.key = key || ''
      this.options = options
      this.options.api = url + apitypes.weather[options.api]
    }
    sign() {
      let ctime = Math.floor(new Date().getTime() / 1000)
      let query = `ts=${ctime}&ttl=${this.options.ttl}&uid=${this.uid}`
      let sha1 = CryptoJS.HmacSHA1(query, this.key)
      let sign = encodeURIComponent(sha1.toString(CryptoJS.enc.Base64))
      return query + '&sig=' + sign
    }
    request() {
      const signed = this.sign()
      let url = `location=${this.options.location}&unit=${this.options.unit}&language=${this.options.language}&${signed}&callback=${this.options.callback}`
      let tag = document.createElement('script')
      tag.src = this.options.api + url
      document.body.appendChild(tag)
    }
  }

  const domTime = document.getElementById('time')
  const domCalendarBox = document.getElementById('calendar-box')
  const domCalendarViewer = document.getElementById('calendar-viewer')

  function updateTime() {
    const date = new Date()
    const hour = date
      .getHours()
      .toString()
      .padStart(2, 0)
    const minute = date
      .getMinutes()
      .toString()
      .padStart(2, 0)
    const second = date
      .getSeconds()
      .toString()
      .padStart(2, 0)

    domTime.innerText = hour + ':' + minute + ':' + second
  }

  setInterval(() => {
    updateTime()
  }, 1000)

  const viewerOptions = {
    rx: 0,
    // ry: -18
    ry: 0
  }

  function resetCalendarRotate() {
    domCalendarBox.style.setProperty('--rx', viewerOptions.rx + 'deg')
    domCalendarBox.style.setProperty('--ry', viewerOptions.ry + 'deg')
  }
  resetCalendarRotate()

  domCalendarBox.onmousemove = _.throttle((e) => {
    const width = window.innerWidth / 2
    const height = window.innerHeight / 2
    const unit = 10
    let y = e.clientX
    let x = e.clientY

    x = ((x - width) / width) * unit
    y = ((y - height) / height) * unit

    x = viewerOptions.rx + x

    y = viewerOptions.ry - y

    domCalendarBox.style.setProperty('--rx', x + 'deg')
    domCalendarBox.style.setProperty('--ry', y + 'deg')
  }, 100)

  domCalendarBox.onmouseleave = (e) => {
    setTimeout(() => {
      resetCalendarRotate()
    }, 200)
  }

  function getWeather() {
    let info = localStorage.getItem('weather/update/time')
    try {
      info = JSON.parse(info)
    } catch (error) {
      info = {}
    }

    const updateRate = 1000 * 60

    const lastUpdateTime = +info.last_update_time || 0

    if (new Date().getTime() - lastUpdateTime < updateRate) {
      weatherCallback({ results: [info] })
    } else {
      const s = new Seniverse(_config_.weather.key, _config_.weather.secret, {
        api: 'now',
        location: _config_.weather.city,
        callback: 'weatherCallback'
      })

      s.request()
    }

    setTimeout(() => {
      getWeather()
    }, updateRate + 10 * 1000)
  }

  getWeather()
})()

function weatherCallback(responses) {
  const res = responses.results[0]
  const domTemperature = document.getElementById('temperature')
  domTemperature.innerText = _config_.weather.city + ' - ' + res.now.temperature + ' °C'

  if (res.last_update_time) {
    console.log('from cache', res)
  } else {
    console.log('new', res)
    res.last_update_time = new Date().getTime()
  }

  localStorage.setItem('weather/update/time', JSON.stringify(res))
}
