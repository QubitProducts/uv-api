Universal Variable API
----------------------

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

[ ![Codeship Status for qubitdigital/uv-api](https://codeship.com/projects/f8884a40-8ad8-0132-dedc-76c1126cf0b3/status?branch=master)](https://codeship.com/projects/60163)



_The Universal Variable API moves business level data into another dimension by introducing a completely event based approach to representing page level data flow._

This project contains the source code and tests for the Universal Variable API. A script tag with a minified version of the API should be inserted inline for all html documents, at the top of head, immediately after the `<meta charset... />` tag.

Methodology
===========

Universal Variable is used for exposing internal data to third party businesses integrating technology with websites and apps. Until recently it has sufficed to provide a global object with an ecommerce-based schema however as web and mobile apps become more prominant it has become difficult to represent data changes as the visitor navigates the app with few or no page reloads.


Moving forward all data is exposed as events using a global API. There is a range of event schemas to represent data for many different use cases, namespacing is used to group events that are related. Event schemas contain nested objects that also have schema. Note that the schemas have been built so that events carry a lot of relevant embedded information to avoid the need to join between events. Though there is a lot of replicated data in the schema, the embeddeding severly reduces lookup time and increases ease of use.

Compatibility
=============

Tested in IE8+, Firefox, Opera, Chrome and Safari.

API
===

### Emit

`uv.emit(type, [data])`

Emits an event with the __type__ and __data__ specified. The __data__ should conform to the schema for the event __type__ emitted. All events that are emitted are given a `meta` property with the event `type`.

```javascript
uv.emit('ec.ProductView', {
  product: {
    id: '112-334-a',
    price: 6.99,
    name: '18th Birthday Baloon',
    category: ['Party Accessories', 'Birthday Parties']
  },
  color: 'red',
  stock: 6
})
// => emits an ec.ProductView event
```

The emitted event will have meta attached.

```json
{
  "meta": {
    "type": "ec.ProductView"
  },
  "product": {
    "id": "112-334-a",
    "price": 6.99,
    "name": "18th Birthday Baloon",
    "category": ["Party Accessories", "Birthday Parties"]
  },
  "color": "red",
  "stock": 6
}
```


### On

`uv.on(type, handler, [context])`

Attaches an event __handler__ to be called when a certain event __type__ is emitted. The __handler__ will be passed the event data and will be bound to the __context__ object, if one is passed. Returns a subscription object which can detatch the handler using the dispose method. If a regex is passed, the handler will execute on events that match the regex.

```javascript
uv.on('ec.Product.View', function (data) {
  console.log(data)
})
// => logs data when an `ec.Product.View` event is emitted
var sub = uv.on(/.*/, function (data) {
  console.log(data)
})
// => logs data for all events
sub.dispose()
// => detatches the event handler
```


### Once

`uv.once(type, handler, [context])`

Attaches an event __handler__ that will be called once, only on the next event emitted that matches the __type__ specified. The __handler__ will be passed the event data and will be bound to the context object, if one is passed. Returns a subscription object which can detatch the __handler__ using the dispose method. If a regex is passed, the handler will execute on the next event to match the regex.


```javascript
uv.once('ec.Product.View', function (data) {
  console.log(data)
})
emit('ec.Product.View')
// => logs data
emit('ec.Product.View')
// => does not log
```

### Map

`uv.map(iterator, [context])`

Returns a new array by passing the __iterator__ function over the events array in the given (optional) __context__.


```javascript
uv.emit('Search')
uv.emit('View', {
  type: 'product'
})
uv.emit('Search')
var events = uv.map(function (event) {
  return event.meta.type
})
console.log(events)
// => logs ['Search', 'View', 'Search']
```


### Events

The events array is a cache of events emitted since the last page load. By iterating over the array it is possible to interpret the user journey or the current state of the page.

### Deliver module

The uv-api is available on the deliver

```bash
deliver install @qubit/uv-api
```

The module exports a createUv function if required using commonjs.

```js
var createUv = require('@qubit/uv-api')
var uv = createUv()
uv.emit('ec.View')
```
