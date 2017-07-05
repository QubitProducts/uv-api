(function qubit () {
  // create the namespace
  window.qubit = window.qubit || {}

  // expose the fundamental functions
  window.qubit.emit = window.qubit.emit || emit
  window.qubit.events = window.qubit.events || []
  window.qubit.listeners = window.qubit.listeners || []
  window.qubit.onReady = function (fn) {
    window.qubit.listeners.push(fn)
    return function (dispose) {
      window.qubit.listeners = filter(window.qubit.listeners, function (l) {
        return l !== fn
      })
    }
  }

  // and inject smartserve
  var script = document.createElement('script')
  script.src = 'https://static.goqubit.com/smartserve-2499.js'
  document.getElementsByTagName('head')[0].appendChild(script)

  /**
   * Pushes an event to the events array and triggers any handlers for that event
   * type, passing the data to that handler. Clones the data to prevent side effects.
   *
   * @param {String} type  The type of event.
   * @param {Object} event The data associated with the event.
   */
  function emit (type, event) {
    event = clone(event || {})
    event.meta = event.meta || {}
    event.meta.type = type
    window.qubit.events.push(event)
  }

  /**
   * Returns a shallow clone of the input
   * object.
   * @param  {Object} input
   *
   * @return {Object}
   */
  function clone (input) {
    var output = {}
    for (var key in input) {
      if (input.hasOwnProperty(key)) {
        output[key] = input[key]
      }
    }
    return output
  }

  function filter (list, iterator) {
    var l = list.length
    var output = []
    for (var i = 0; i < l; i++) {
      if (iterator(list[i])) output.push(list[i])
    }
    return output
  }
}())
