<!--
  This file was generated by 'make-readme.js', edit README.tmpl.md and run 'make build' instead
-->
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

Minified snippet
===

For embedding onto client websites

```js
function createUv(){function e(e){p.level=e}function n(e,n){p.info(e,"event emitted"),n=c(n||{}),n.meta=n.meta||{},n.meta.type=e,a.push(n),r(),v.listeners=f(v.listeners,function(e){return!e.disposed})}function t(e,n,t){function r(){return p.info("Replaying events"),o(function(){s(v.events,function(o){c.disposed||l(e,o.meta.type)&&n.call(t,o)})}),f}function i(){return p.info("Disposing event handler"),c.disposed=!0,f}p.info("Attaching event handler for",e);var c={type:e,callback:n,disposed:!1,context:t||window};v.listeners.push(c);var f={replay:r,dispose:i};return f}function o(e){p.info("Calling event handlers"),u++;try{e()}catch(e){p.error("UV API Error",e.stack)}u--,r()}function r(){if(0===a.length&&p.info("No more events to process"),a.length>0&&u>0&&p.info("Event will be processed later"),a.length>0&&0===u){p.info("Processing event");var e=a.shift();v.events.push(e),o(function(){s(v.listeners,function(n){if(!n.disposed&&l(n.type,e.meta.type))try{n.callback.call(n.context,e)}catch(e){p.error("Error emitting UV event",e.stack)}})})}}function i(e,n,t){var o=v.on(e,function(){n.apply(t||window,arguments),o.dispose()});return o}function s(e,n){for(var t=e.length,o=0;o<t;o++)n(e[o],o)}function c(e){var n={};for(var t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);return n}function l(e,n){return"string"==typeof e?e===n:e.test(n)}function f(e,n){for(var t=e.length,o=[],r=0;r<t;r++)n(e[r])&&o.push(e[r]);return o}var a=[],u=0,p={info:function(){p.level>e.INFO||console&&console.info&&console.info.apply(console,arguments)},error:function(){p.level>e.ERROR||console&&console.error&&console.error.apply(console,arguments)}};e.ALL=0,e.INFO=1,e.ERROR=2,e.OFF=3,e(e.ERROR);var v={on:t,emit:n,once:i,events:[],listeners:[],logLevel:e};return v}"object"==typeof module&&module.exports?module.exports=createUv:window&&(window.uv=createUv());
```

API
===

### Emit

`uv.emit(type, [data])`

Emits an event with the __type__ and __data__ specified. The __data__ should conform to the schema for the event __type__ emitted. All events that are emitted are given a `meta` property with the event `type`.

```js
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

Attaches an event __handler__ to be called when a certain event __type__ is emitted. The __handler__ will be passed the event data and will be bound to the __context__ object, if one is passed. If a regex is passed, the handler will execute on events that match the regex.

```js
uv.on('ec.Product.View', function (data) {
  console.log(data)
})
// => logs data when an `ec.Product.View` event is emitted

var subscription = uv.on(/.*/, function (data) {
  console.log(data)
})
// => logs data for all events
```

The on method returns a subscription object which can detatch the handler using the dispose method and can also be used to replay events currently in the event array. Note that subscription that have been disposed will not call the handler when replay is called.

```js
subscription.dispose()
// => detatches the event handler

subscription.replay()
// => calls the handler for all events currently in uv.events
```


### Once

`uv.once(type, handler, [context])`

Attaches an event __handler__ that will be called once, only on the next event emitted that matches the __type__ specified. The __handler__ will be passed the event data and will be bound to the context object, if one is passed. Returns a subscription object which can detatch the __handler__ using the dispose method. If a regex is passed, the handler will execute on the next event to match the regex.


```js
uv.once('ec.Product.View', function (data) {
  console.log(data)
})
emit('ec.Product.View')
// => logs data

emit('ec.Product.View')
// => does not log
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
