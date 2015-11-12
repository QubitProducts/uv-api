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
  var emittingEvents = []

  /**
   * Creates the uv object with empty
   * events and listeners arrays.
   *
   * @type {Object}
   */
  var uv = {
    emit: emit,
    on: on,
    once: once,
    map: map,
    events: [],
    listeners: []
  }

  return uv

  /**
   * Pushes an event to the events array and triggers any handlers for that event
   * type, passing the data to that handler. Clones the data to prevent side effects.
   *
   * @param {String} type The type of event.
   * @param {Object} data The data associated with the event.
   */
  function emit (type, data) {
    data = clone(data || {})
    data.meta = {
      type: type
    }
    emittingEvents.push(data)
    if (emittingEvents.length === 1) {
      callHandlers(emittingEvents[0])
    }
  }

  function callHandlers (event) {
    uv.events.push(event)
    forEach(uv.listeners, function (listener) {
      if (listener.type === event.meta.type || listener.type === '*') {
        try {
          listener.callback.call(listener.context, event)
        } catch (e) {
          if (console && console.error) {
            console.error('Error emitting UV event', e.stack)
          }
        }
      }
    })
    emittingEvents.shift()
    if (emittingEvents.length > 0) {
      callHandlers(emittingEvents[0])
    }
  }

  /**
   * Attaches an event handler to listen to the type of event specified.
   *
   * @param   {String}   type         The type of event.
   * @param   {Function} callback     The callback called when the event occurs.
   * @param   {Object}   context      The context that will be applied to the callback (optional).
   * @returns {Object}   subscription A subscription object that returns a dispose method.
   */
  function on (type, callback, context) {
    var ref = {}
    uv.listeners.push({
      type: type,
      callback: callback,
      context: context || window,
      ref: ref
    })
    return {
      dispose: dispose
    }

    function dispose () {
      for (var i = 0; i < uv.listeners.length; i++) {
        if (uv.listeners[i].ref === ref) {
          uv.listeners.splice(i, 1)
          return
        }
      }
    }
  }

  /**
   * Attaches an event handler to listen to the type of event specified.
   * The handle will only be executed once.
   *
   * @param   {String}   type         The type of event.
   * @param   {Function} callback     The callback called when the event occurs.
   * @param   {Object}   context      The context that will be applied
   *                                  to the callback (optional).
   * @returns {Object}   subscription A subscription object which can off the
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
   * Returns a new array by passing the iterator function over the events
   * array in the given context.
   *
   * @param  {Function} iterator The iterator to call for each event.
   * @param  {Object}   context  Optional. The context in which the iterator is called.
   * @return {Array}    result   A new array of the mapped events.
   */
  function map (iterator, context) {
    var result = []
    context = context || window
    forEach(uv.events, function (event, i) {
      result.push(iterator.call(context, event, i))
    })
    return result
  }

  function forEach (list, iterator) {
    for (var i = 0; i < list.length; i++) {
      iterator(list[i], i)
    }
  }

  /**
   * Returns a shallow clone of the input
   * object.
   * @param  {Object} input
   * @return {Object} output
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
}
