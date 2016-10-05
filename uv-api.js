(function exportUv () {
  /**
   * Export the api to window.uv unless required as a commonjs module.
   */
  if (typeof module === 'object' && module.exports) {
    module.exports = createUv
  } else if (window) {
    window.uv = createUv()
  }

  function createUv () {
    /**
     * Used to prevent recursive event calling.
     *
     * @type {Array}
     */
    var eventQueue = []
    var callingHandlers = 0

    /**
     * Simple log class
     *
     * @type {Object}
     */
    var log = {
      info: function logInfo () {
        if (log.level > logLevel.INFO) return
        if (console && console.info) {
          console.info.apply(console, arguments)
        }
      },
      error: function logError () {
        if (log.level > logLevel.ERROR) return
        if (console && console.error) {
          console.error.apply(console, arguments)
        }
      }
    }

    logLevel.ALL = 0
    logLevel.INFO = 1
    logLevel.ERROR = 2
    logLevel.OFF = 3

    logLevel(logLevel.ERROR)

    /**
     * Creates the uv object with empty
     * events and listeners arrays.
     *
     * @type {Object}
     */
    var uv = {
      on: on,
      emit: emit,
      once: once,
      events: [],
      listeners: [],
      logLevel: logLevel
    }

    return uv

    /**
     * Sets the log level for the API.
     *
     * @param  {Number} level   Should be one of the constants
     *                          set on the logLevel function.
     */
    function logLevel (level) {
      log.level = level
    }

    /**
     * Pushes an event to the events array and triggers any handlers for that event
     * type, passing the data to that handler. Clones the data to prevent side effects.
     *
     * @param {String} type  The type of event.
     * @param {Object} event The data associated with the event.
     */
    function emit (type, event) {
      log.info(type, 'event emitted')

      event = clone(event || {})
      event.meta = event.meta || {}
      event.meta.type = type

      eventQueue.push(event)
      processNextEvent()

      /**
       * Remove disposed listeners
       * to prevent memory leak.
       */
      uv.listeners = filter(uv.listeners, function (l) {
        return !l.disposed
      })
    }

    /**
     * Attaches an event handler to listen to the type of event specified.
     *
     * @param   {String|Regex} type         The type of event.
     * @param   {Function}     callback     The callback called when the event occurs.
     * @param   {Object}       context      The context that will be applied to the
     *                                      callback (optional).
     *
     * @returns {Object}                    A subscription object that
     *                                      returns a dispose method.
     */
    function on (type, callback, context) {
      log.info('Attaching event handler for', type)

      var listener = {
        type: type,
        callback: callback,
        disposed: false,
        context: context || window
      }
      uv.listeners.push(listener)

      var subscription = {
        replay: replay,
        dispose: dispose
      }
      return subscription

      function replay () {
        log.info('Replaying events')
        queueEmittedEvents(function () {
          forEach(uv.events, function (event) {
            if (listener.disposed) return
            if (!matches(type, event.meta.type)) return
            callback.call(context, event)
          })
        })
        return subscription
      }

      function dispose () {
        log.info('Disposing event handler')
        listener.disposed = true
        return subscription
      }
    }

    /**
     * Prevents emitted events from being
     * processed until fn finishes.
     *
     * @param  {Function} fn
     */
    function queueEmittedEvents (fn) {
      log.info('Calling event handlers')
      callingHandlers++
      try { fn() } catch (e) {
        log.error('UV API Error', e.stack)
      }
      callingHandlers--
      processNextEvent()
    }

    /**
     * Processes the next event on the
     * eventQueue.
     */
    function processNextEvent () {
      if (eventQueue.length === 0) {
        log.info('No more events to process')
      }

      if (eventQueue.length > 0 && callingHandlers > 0) {
        log.info('Event will be processed later')
      }

      if (eventQueue.length > 0 && callingHandlers === 0) {
        log.info('Processing event')

        var event = eventQueue.shift()
        uv.events.push(event)
        queueEmittedEvents(function () {
          forEach(uv.listeners, function (listener) {
            if (listener.disposed) return
            if (!matches(listener.type, event.meta.type)) return
            try {
              listener.callback.call(listener.context, event)
            } catch (e) {
              log.error('Error emitting UV event', e.stack)
            }
          })
        })
      }
    }

    /**
     * Attaches an event handler to listen to the type of event specified.
     * The handle will only be executed once.
     *
     * @param   {String|Regex} type     The type of event.
     * @param   {Function}     callback The callback called when the event occurs.
     * @param   {Object}       context  The context that will be applied
     *                                  to the callback (optional).
     *
     * @returns {Object}                A subscription object which can off the
     *                                  handler using the dispose method.
     */
    function once (type, callback, context) {
      var subscription = uv.on(type, function () {
        callback.apply(context || window, arguments)
        subscription.dispose()
      })
      return subscription
    }

    /**
     * Iterate over each item in an array.
     *
     * @param  {Array} list
     * @param  {Function} iterator
     */
    function forEach (list, iterator) {
      var length = list.length
      for (var i = 0; i < length; i++) {
        iterator(list[i], i)
      }
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

    /**
     * Returns true if the test string matches
     * the subject or the test regex matches the subject.
     * @param  {String|Regex} test
     * @param  {String}       subject
     *
     * @return {Boolean}
     */
    function matches (test, subject) {
      return typeof test === 'string' ? test === subject : test.test(subject)
    }

    /**
     * Returns a new array containing the items in
     * array for which predicate returns true.
     * @param  {Array}   list
     * @param  {Function} iterator
     *
     * @return {Array}
     */
    function filter (list, iterator) {
      var l = list.length
      var output = []
      for (var i = 0; i < l; i++) {
        if (iterator(list[i])) output.push(list[i])
      }
      return output
    }
  }
}())
