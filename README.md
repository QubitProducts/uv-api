Universal Variable API
----------------------

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

Emits an event with the __type__ and __data__ specified. The __data__ should conform to the schema for the event __type__ emitted.

```javascript
uv.emit('ec:product.view', {
  product: {
    id: '112-334-a',
    price: 6.99,
    name: '18th Birthday Baloon',
    breadcrumb: ['Party Accessories', 'Birthday Parties']
  },
  color: 'red',
  stock: 6
});
// => emits an ec:product.view event
```

### On

`uv.on(type, handler, [context])`

Attaches an event __handler__ to be called when a certain event __type__ is emitted. The __handler__ will be passed the event type and event data as arguments and will be bound to the __context__ object, if one is passed. Returns a subscription object which can detatch the handler using the dispose method. If an event __type__ `*` is passed, the handler will execute on all events.

```javascript
uv.on('ec:product.view', function (type, data) {
  console.log(type);
  console.log(data);
});
// => logs type and data when an `ec:product.view` event is emitted
var sub = uv.on('*', function (type, data) {
  console.log(type);
  console.log(data);
});
// => logs type and data for all events
sub.dispose();
// => detatches the event handler
```


### Once

`uv.once(type, handler, [context])`

Attaches an event __handler__ that will be called once, only on the next event emitted that matches the __type__ specified. The __handler__ will be passed the event type and event data as arguments and will be bound to the context object, if one is passed. Returns a subscription object which can detatch the __handler__ using the dispose method. If an event __type__ `*` is passed, the __handler__ will execute on the next event regardless of type.


```javascript
uv.once('ec:product.view', function (type, data) {
  console.log(type);
  console.log(data);
});
emit('ec:product.view');
// => logs type and data
emit('ec:product.view');
// => does not log
```

### Map

`uv.map(type, iterator, [context])`

Returns a new array by passing the __iterator__ function over the events array in the given (optional) __context__. Filters events by the __type__ specified. If a wildcard `*` is passed, all events will be mapped.


```javascript
uv.emit('search');
uv.emit('view', {
  type: 'product'
});
uv.emit('search');
uv.map('search', function (event) {
  console.log(event.meta.type);
});
// => logs 'search', 'search'
var events = uv.map('*', function (event) {
  return event.type;
});
console.log(events);
// => logs ['product']
```


### Events

The events array is a cache of events emitted since the last page load. By iterating over the array it is possible to interpret the user journey or the current state of the page.