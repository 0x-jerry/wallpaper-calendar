function weatherCallback(responses) {
  const res = responses.results[0]
  const domTemperature = document.getElementById('temperature')

  domTemperature.innerText = res.location.name + ' ~ ' + res.now.temperature + ' °C'

  if (res.last_update_time) {
    console.log('from cache', res)
  } else {
    console.log('from new request', res)
    res.last_update_time = new Date().getTime()
  }

  localStorage.setItem('weather/update/time', JSON.stringify(res))
}

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
        language: 'en',
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

  async function getWeather() {
    let info = localStorage.getItem('weather/update/time')

    try {
      info = JSON.parse(info || '{}')
    } catch (error) {
      info = {}
    }

    if (!_config_.weather.key) {
      return console.warn('Please input weather key and secret: https://www.seniverse.com')
    }

    const updateRate = 1000 * _config_.weather.updateRate

    const lastUpdateTime = +info.last_update_time || 0

    if (new Date().getTime() - lastUpdateTime < updateRate) {
      weatherCallback({ results: [info] })
    } else {
      let city = _config_.weather.city

      if (typeof city === 'function') {
        city = await _config_.weather.city()
      }

      const s = new Seniverse(_config_.weather.key, _config_.weather.secret, {
        api: 'now',
        location: city,
        callback: 'weatherCallback'
      })

      s.request()
    }

    setTimeout(() => {
      getWeather()
    }, updateRate + 10 * 1000)
  }

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

  function updateCalendarTable() {
    function createTr() {
      return document.createElement('tr')
    }

    function createTh(text, active) {
      const node = document.createElement('th')
      node.innerText = text

      if (active) {
        node.classList.add('active')
      }
      return node
    }

    function createTd(text, active, classes = []) {
      const node = document.createElement('td')
      node.innerText = text

      node.classList.add(...classes)
      if (active) {
        node.classList.add('active')
      }
      return node
    }

    const date = dayjs()

    const lastMonth = dayjs().subtract(date.date(), 'day')
    const calendarDays = []

    let lastDayInLastMonth = lastMonth.daysInMonth()

    let weekday = dayjs(date.year() + '-' + (date.month() + 1)).day()

    while (weekday-- > 0) {
      calendarDays.unshift({
        value: lastDayInLastMonth--,
        classes: ['secondary-color']
      })
    }

    for (let i = 1; i <= date.daysInMonth(); i++) {
      calendarDays.push({
        value: i,
        classes: []
      })
    }

    for (let i = 1; ; i++) {
      // col * weekday
      if (calendarDays.length === 6 * 7) {
        break
      }
      calendarDays.push({
        value: i,
        classes: ['secondary-color']
      })
    }

    // create dom
    let tableChildren = []
    tr = createTr()
    tableChildren.push(tr)

    const weekStr = ['SUN', 'MON', 'THE', 'WED', 'THU', 'FRI', 'SAT']
    weekStr.forEach((weekday, idx) => {
      const th = createTh(weekday, idx === date.day())
      tr.appendChild(th)
    })

    calendarDays.forEach((info, idx) => {
      if (idx % 7 === 0) {
        tr = createTr()
        tableChildren.push(tr)
      }
      tr.appendChild(createTd(info.value, info.value === date.date(), info.classes))
    })

    tableChildren.forEach((node) => {
      domCalendarTable.appendChild(node)
    })
  }

  /**
   *
   * @param {MouseEvent} e
   */
  function updateViewer(e) {
    updateViewerView(e.clientX, e.clientY)
  }

  function updateViewerView(x = 'center', y = 'center', width = window.innerWidth * 2) {
    domViewer.style.setProperty('--view-width', width + 'px')

    x = typeof x === 'number' ? x + 'px' : x
    y = typeof y === 'number' ? y + 'px' : y

    domViewer.style.setProperty('--origin-x', x)
    domViewer.style.setProperty('--origin-y', y)
  }

  const domViewer = document.getElementById('viewer')
  const domTime = document.getElementById('time')
  const domCalendarTable = document.getElementById('calendar-table')
  updateViewerView()

  const nodes = document.getElementsByClassName('card-box')
  const viewerUpdateRate = 100
  
  for (const node of nodes) {
    node.onmousemove = _.throttle(updateViewer, viewerUpdateRate)
    node.onmouseleave = () => setTimeout(() => updateViewerView(), viewerUpdateRate + 10)
  }

  document.onmouseleave = () => setTimeout(() => updateViewerView(), viewerUpdateRate + 10)

  setInterval(() => {
    updateTime()
  }, 1000)

  updateTime()
  getWeather()
  updateCalendarTable()
})()
