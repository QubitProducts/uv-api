describe('Universal Variable API', function () {
  var uv;

  beforeEach(function () {
    uv = window.uv;
  });

  afterEach(function () {
    uv.listeners.length = 0;
    uv.events.length = 0;
  });

  it('should create a window object', function () {
    expect(window.uv).to.not.be(undefined);
  });
  it('should expose emit, on, once and map methods and event and listener arrays only', function () {
    expect(window.uv).to.only.have.keys('events', 'listeners', 'emit', 'on', 'once', 'map');
  });

  describe('emit', function () {
    var t1, t2, eventsLength;

    beforeEach(function () {
      uv.on('ec:transaction', function () {
        eventsLength = uv.events.length;
      });
      t1 = new Date();
      uv.emit('search');
      uv.emit('ec:product.view');
      uv.emit('search');
      uv.emit('ec:product.view', {
        stock: 14
      });
      uv.emit('ec:basket.add');
      uv.emit('ec:transaction');
      t2 = new Date();
    });

    it('should add each event to the events array', function () {
      expect(uv.events.length).to.be(6);
    });
    it('should create a meta property with cts, cid and type properties', function () {
      forEach(uv.events, function (event) {
        expect(event.meta).to.only.have.keys('cts', 'cid', 'type');
      });
    });
    it('should keep data associated with the event', function () {
      expect(uv.events[3]).to.only.have.keys('stock', 'meta');
      expect(uv.events[3].stock).to.be(14);
    });
    it('should store events in the events array in order', function () {
      expect(map(uv.events, function (event) {
        return event.meta.type;
      })).to.eql([
        'search',
        'ec:product.view',
        'search',
        'ec:product.view',
        'ec:basket.add',
        'ec:transaction'
      ]);
    });
    it('should generate a unique ID', function () {
      var ids = [];
      forEach(uv.events, function (event) {
        expect(event.meta.cid).to.be.a('string');
        forEach(ids, function (id) {
          expect(event.meta.cid).to.not.be(id);
        });
        ids.push(event.meta.cid);
      });
    });
    it('should generate a timestamp', function () {
      for (var i = 0; i < 6; i++) {
        expect(uv.events[i].meta.cts >= t1.getTime()).to.be(true);
        expect(uv.events[i].meta.cts <= t2.getTime()).to.be(true);
      }
    });
    it('should add events to events array before calling listeners', function () {
      expect(eventsLength).to.be(6);
    });
  });

  describe('on listeners', function () {
    var sub, searchEvents, allEvents, productEvents,
      noneEvents, transactionEvents, errors, errorMemo,
      allContext;

    beforeEach(function () {
      errors = [];
      searchEvents = [];
      allEvents = [];
      productEvents = [];
      noneEvents = [];
      transactionEvents = [];
      if (console && console.error) {
        errorMemo = console.error;
        console.error = function () {
          errors.push(arguments);
        };
      }
      uv.on('search', function () {
        searchEvents.push(arguments);
      });
      uv.on('ec:product.view', function () {
        throw new Error('Some listener error');
      });
      uv.on('ec:product.view', function () {
        productEvents.push(arguments);
      });
      uv.on('*', function () {
        allEvents.push(arguments);
        allContext = this;
      }, { hi: 'dude' });
      uv.on('none', function () {
        noneEvents.push(arguments);
      });
      sub = uv.on('ec:transaction', function () {
        transactionEvents.push(arguments);
      });
      uv.emit('search', {
        resultCount: 10
      });
      uv.emit('search', {
        resultCount: 20
      });
      uv.emit('ec:product.view', {
        id: 'a-fabulous-product'
      });
      uv.emit('ec:transaction', {
        orderId: 'oh-so-orderlicious'
      });
      sub.dispose();
      uv.emit('ec:transaction', {
        orderId: 'oh-so-not-orderlicious'
      });
    });

    afterEach(function () {
      console.error = errorMemo;
    });

    it('should be called in the specified context', function () {
      expect(allContext).to.eql({
        hi: 'dude'
      });
    });
    it('should listen to the specified type', function () {
      expect(searchEvents.length).to.be(2);
      forEach(searchEvents, function (args) {
        expect(args[0].meta.type).to.be('search');
      });
      expect(searchEvents[0][0].resultCount).to.be(10);
      expect(searchEvents[1][0].resultCount).to.be(20);
    });
    it('should not listen to events emitted with a different type', function () {
      expect(noneEvents.length).to.be(0);
    });
    it('should listen to all events given a wildcard type', function () {
      expect(allEvents.length).to.be(5);
    });
    it('should be called if another listener throws an error', function () {
      expect(productEvents.length).to.be(1);
    });
    it('should throw an error if a listener throws an error', function () {
      expect(errors.length).to.be(1);
      expect(errors[0][0]).to.be('Error emitting UV event');
      expect(errors[0][1].message).to.be('Some listener error');
    });
    it('should unsubscribe listeners if the dispose method is called', function () {
      expect(transactionEvents.length).to.be(1);
      expect(transactionEvents[0][0].orderId).to.be('oh-so-orderlicious');
    });
    it('should not throw an error if dispose is called twice', function () {
      expect(sub.dispose).to.not.throwException();
    });
  });

  describe('once listeners', function () {
    var searchEvents, productEvents, searchSub, searchContext;

    beforeEach(function () {
      searchEvents = [];
      productEvents = [];
      searchSub = uv.once('search', function () {
        searchEvents.push(arguments);
        searchContext = this;
      }, {
        no: 'way'
      });
      var productSub = uv.once('ec:product.view', function () {
        productEvents.push(arguments);
      });
      uv.emit('search', {
        resultCount: 10
      });
      uv.emit('search', {
        resultCount: 20
      });
      productSub.dispose();
      uv.emit('ec:product.view', {
        id: 'a-fabulous-product'
      });
    });

    it('should be called in the specified context', function () {
      expect(searchContext).to.eql({
        no: 'way'
      });
    });
    it('should only be called once', function () {
      expect(searchEvents.length).to.be(1);
    });
    it('should not be called if dispose is called', function () {
      expect(productEvents.length).to.be(0);
    });
    it('should not throw an error if dispose is called after the first call', function () {
      expect(searchSub.dispose).to.not.throwException();
    });
  });

  describe('map', function () {
    var allEvents, allMap, context;
    beforeEach(function () {
      uv.emit('view');
      uv.emit('search', { resultCount: 20 });
      uv.emit('ec:product.view');
      uv.emit('view');
      uv.emit('search', { resultCount: 10 });
      uv.emit('ec:transaction');
      allEvents = [];
      allMap = uv.map(function (event) {
        context = this;
        allEvents.push(event);
        return event.meta.type;
      }, {
        hi: 'dudealicious'
      });
    });
    it('should run over all events', function () {
      expect(allEvents.length).to.be(6);
    });
    it('should return an array map of all events', function () {
      expect(allMap).to.eql([
        'view',
        'search',
        'ec:product.view',
        'view',
        'search',
        'ec:transaction'
      ]);
    });
    it('should execute the iterator in the given context', function () {
      expect(context).to.eql({
        hi: 'dudealicious'
      });
    });
  });

});

function forEach(list, it) {
  for (var i = 0; i < list.length; i++) {
    it(list[i], i);
  }
}

function map(list, it) {
  var result = [];
  forEach(list, function (val, i) {
    result.push(it(val, i));
  });
  return result;
}