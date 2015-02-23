/**
 * Creates a global uv object for emmitting and listening for events.
 */
(function () {

  /**
   * Creates the uv object with empty
   * events and listeners arrays.
   * @type {Object}
   */
  var uv = {
    events: [],
    listeners: []
  };

  /**
   * Pushes an event to the events array and triggers any handlers for that event
   * type, passing the data to that handler.
   * @param {String} type The type of event.
   * @param {Object} data The data associated with the event.
   */
  uv.emit = function emit(type, data) {
    data = data || {};
    data.meta = {
      clientId: guid(),
      clientTs: (new Date()).getTime(),
      type: type
    };
    uv.events.push(data);
    forEach(uv.listeners, function (listener) {
      if (listener.type === type || listener.type === '*') {
        try {
          listener.callback.call(listener.context, data);
        } catch (e) {
          if (console && console.error) {
            console.error('Error emitting UV event', e);
          }
        }
      }
    });
  };

  /**
   * Attaches an event handler to listen to the type of event specified.
   * @param   {String}   type         The type of event.
   * @param   {Function} callback     The callback called when the event occurs.
   * @param   {Object}   context      The context that will be applied to the callback (optional).
   * @returns {Object}   subscription A subscription object which can off the handler using the dispose method.
   */
  uv.on = function on(type, callback, context) {
    var ref = {};
    uv.listeners.push({
      type: type,
      callback: callback,
      context: context || window,
      ref: ref
    });
    return {
      dispose: dispose
    };

    function dispose() {
      for (var i = 0; i < uv.listeners.length; i++) {
        if (uv.listeners[i].ref === ref) {
          uv.listeners.splice(i, 1);
          return;
        }
      }
    }
  };

  /**
   * Attaches an event handler to listen to the type of event specified. The handle will only be executed once.
   * @param   {String}   type         The type of event.
   * @param   {Function} callback     The callback called when the event occurs.
   * @param   {Object}   context      The context that will be applied to the callback (optional).
   * @returns {Object}   subscription A subscription object which can off the handler using the dispose method.
   */
  uv.once = function once(type, callback, context) {
    var subscription = uv.on(type, function () {
      callback.apply(context || window, arguments);
      subscription.dispose();
    });
    return subscription;
  };

  /**
   * Returns a new array by passing the iterator function over the events array in the given context.
   * @param  {Function} iterator The iterator to call for each event.
   * @param  {Object}   context  Optional. The context in which the iterator is called.
   * @return {Array}    result   A new array of the mapped events.
   */
  uv.map = function map(iterator, context) {
    var result = [];
    context = context || window;
    forEach(uv.events, function (event, i) {
      result.push(iterator.call(context, event, i));
    });
    return result;
  };

  /**
   * Attaches uv to the window.
   */
  window.uv = uv;

  function forEach(list, iterator) {
    for (var i = 0; i < list.length; i++) {
      iterator(list[i], i);
    }
  }

  /**
   * Returns a random 4 digit hexidecimal number.
   */
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  /**
   * Returns a guid.
   */
  function guid() {
    return [s4(), s4(), '-', s4(), '-', s4(), '-', s4(), '-', s4(), s4()]
      .join('');
  }
}());