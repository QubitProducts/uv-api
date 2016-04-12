/* global describe, it, beforeEach, afterEach, expect, sinon */

describe('uv', function () {
  var uv = window.uv

  afterEach(function () {
    uv.listeners.length = 0
    uv.events.length = 0
  })

  it('should create a window object', function () {
    expect(window.uv).to.not.be(undefined)
  })

  it('should expose emit, on and once methods and event and listener arrays only', function () {
    expect(window.uv).to.only.have.keys('events', 'listeners', 'emit', 'on', 'once')
  })

  describe('emit', function () {
    it('should add each event to the events array', function () {
      uv.emit('ecSearch')
      uv.emit('ecProductView')
      expect(uv.events.length).to.be(2)
    })

    it('should create a meta property with type property', function () {
      uv.emit('ecSearch')
      uv.emit('ecProductView')
      expect(uv.events[0]).to.eql({
        meta: {
          type: 'ecSearch'
        }
      })
      expect(uv.events[1]).to.eql({
        meta: {
          type: 'ecProductView'
        }
      })
    })

    it('should not overwrite meta of an emitted event', function () {
      uv.emit('ecSearch', {
        meta: {
          someMeta: 'thing'
        }
      })

      expect(uv.events[0]).to.eql({
        meta: {
          type: 'ecSearch',
          someMeta: 'thing'
        }
      })
    })

    it('should keep data associated with the event', function () {
      uv.emit('ecSearch')
      uv.emit('ecProductView', {
        stock: 14
      })

      expect(uv.events[1]).to.eql({
        stock: 14,
        meta: {
          type: 'ecProductView'
        }
      })
    })

    it('should add events to events array before calling listeners', function () {
      var eventsLength

      uv.on('ecTransaction', function () {
        eventsLength = uv.events.length
      })
      uv.emit('search')
      uv.emit('ecTransaction')
      uv.emit('search')

      expect(eventsLength).to.be(2)
    })

    it('should not mutate the data passed', function () {
      var data = {
        orderId: 1
      }

      uv.emit('ecTransaction', data)

      expect(data).to.eql({
        orderId: 1
      })
    })

    it('should add recursive events to the end of the queue', function () {
      var boopFinished = false
      var meepFinished = false

      uv.on('boop', function () {
        uv.emit('meep')
        expect(uv.events).to.eql([
          { meta: { type: 'boop' } }
        ])
        boopFinished = true
      })
      uv.on('meep', function () {
        expect(boopFinished).to.be(true)
        meepFinished = true
      })
      uv.emit('boop')

      expect(meepFinished).to.be(true)
      expect(uv.events).to.eql([
        { meta: { type: 'boop' } },
        { meta: { type: 'meep' } }
      ])
    })
  })

  describe('on', function () {
    var errors, errorMemo

    beforeEach(function () {
      errors = []
      if (console && console.error) {
        errorMemo = console.error
        console.error = function () {
          errors.push(arguments)
        }
      }
    })

    afterEach(function () {
      console.error = errorMemo
    })

    it('should be called in the specified context', function () {
      var context

      uv.on('ecView', function () {
        context = this
      }, { hi: 'dude' })
      uv.emit('ecView')

      expect(context).to.eql({ hi: 'dude' })
    })

    it('should listen to the specified type', function () {
      var searchHandler = sinon.stub()
      var productHandler = sinon.stub()

      uv.on('ecSearch', searchHandler)
      uv.on('ecProductView', productHandler)
      uv.emit('ecSearch')
      uv.emit('ecSearch')
      uv.emit('ecProductView')
      uv.emit('ecSearch')

      expect(searchHandler.callCount).to.be(3)
      expect(productHandler.callCount).to.be(1)
    })

    it('should be passed the event', function () {
      var searchHandler = sinon.stub()
      var productHandler = sinon.stub()

      uv.on('ecSearch', searchHandler)
      uv.on('ecProductView', productHandler)
      uv.emit('ecSearch', { resultCount: 3 })
      uv.emit('ecProductView', { name: 'uhh erm thing' })
      uv.emit('ecSearch')

      expect(searchHandler.getCall(0).args.length).to.be(1)
      expect(searchHandler.getCall(0).args[0]).to.eql({
        meta: { type: 'ecSearch' },
        resultCount: 3
      })

      expect(productHandler.getCall(0).args[0]).to.eql({
        meta: { type: 'ecProductView' },
        name: 'uhh erm thing'
      })

      expect(searchHandler.getCall(1).args.length).to.be(1)
      expect(searchHandler.getCall(1).args[0]).to.eql({
        meta: { type: 'ecSearch' }
      })
    })

    it('should be called if another listener throws an error', function () {
      var badHandler = sinon.spy(function () { throw new Error() })
      var handler = sinon.stub()

      uv.on('ecProductView', badHandler)
      uv.on('ecProductView', handler)
      uv.on('ecProductView', badHandler)

      uv.emit('ecProductView')

      expect(handler.callCount).to.be(1)
      expect(badHandler.callCount).to.be(2)
    })

    it('should throw an error if a listener throws an error', function () {
      var stack = {}

      uv.on('ecProductView', function () {
        var e = new Error('Some listener error')
        e.stack = stack
        throw e
      })
      uv.emit('ecProductView')

      expect(errors.length).to.be(1)
      expect(errors[0][0]).to.be('Error emitting UV event')
      expect(errors[0][1]).to.be(stack)
    })

    it('should unsubscribe listeners if the dispose method is called', function () {
      var handler = sinon.stub()
      var subscription = uv.on('ecProductView', handler)

      uv.emit('ecProductView')
      uv.emit('ecProductView')

      subscription.dispose()
      uv.emit('ecProductView')

      expect(handler.callCount).to.be(2)
    })

    it('should not duplicate recursive events on replay', function () {
      var allEventsHandler = sinon.spy(function (e) {
        if (e.meta.type === 'a') {
          uv.emit('b')
        }
      })
      uv.emit('a')
      uv.on(/.*/, allEventsHandler).replay()
      expect(allEventsHandler.callCount).to.be(2)
    })

    it('should replay past events if the replay method is called', function () {
      var handler = sinon.stub()

      uv.emit('ecProductView', { some: 'data' })
      uv.emit('ecProductView')
      var subscription = uv.on('ecProductView', handler)

      uv.emit('ecProductView')
      expect(handler.callCount).to.be(1)

      subscription.replay()
      expect(handler.callCount).to.be(4)

      expect(handler.getCall(1).args[0]).to.eql({
        meta: { type: 'ecProductView' },
        some: 'data'
      })
    })

    it('should return subscription from replay and dispose methods', function () {
      var subscription = uv.on('ecProductView', sinon.stub())
      expect(subscription.replay()).to.be(subscription)
      expect(subscription.dispose()).to.be(subscription)
    })

    it('should not replay past events if the subscription is disposed', function () {
      var handler = sinon.stub()

      uv.emit('ecProductView', { some: 'data' })
      uv.emit('ecProductView')
      var subscription = uv.on('ecProductView', handler)

      uv.emit('ecProductView')
      expect(handler.callCount).to.be(1)

      subscription.dispose()
      subscription.replay()
      expect(handler.callCount).to.be(1)
    })

    it('should not throw an error if dispose is called twice', function () {
      var subscription = uv.on('ecProductView', sinon.stub())
      subscription.dispose()

      expect(subscription.dispose).to.not.throwException()
    })

    it('should listen to events given a regex', function () {
      var viewHandler = sinon.stub()
      var allHandler = sinon.stub()

      uv.on(/^[a-z]+View$/, viewHandler)
      uv.on(/.*/, allHandler)
      uv.emit('ecView')
      uv.emit('ecProduct')
      uv.emit('trView')

      expect(viewHandler.callCount).to.be(2)
      expect(allHandler.callCount).to.be(3)
    })
  })

  describe('once', function () {
    it('should be called in the specified context', function () {
      var context

      uv.once('ecView', function () {
        context = this
      }, { hi: 'dude' })
      uv.emit('ecView')

      expect(context).to.eql({ hi: 'dude' })
    })

    it('should only be called once', function () {
      var onceHandler = sinon.stub()
      uv.once('ecView', onceHandler)

      uv.emit('ecView')
      uv.emit('ecView')
      uv.emit('ecView')

      expect(onceHandler.callCount).to.be(1)
    })

    it('should not be called if dispose is called', function () {
      var onceHandler = sinon.stub()
      var subscription = uv.once('ecView', onceHandler)
      subscription.dispose()
      uv.emit('ecView')

      expect(onceHandler.callCount).to.be(0)
    })

    it('should replay past events once if the replay method is called', function () {
      var handler = sinon.stub()

      uv.emit('ecProductView')
      uv.emit('ecProductView')
      var subscription = uv.once('ecProductView', handler)

      subscription.replay()
      expect(handler.callCount).to.be(1)
    })

    it('should not replay past events if a matching event has been emitted', function () {
      var handler = sinon.stub()
      var subscription = uv.once('ecProductView', handler)

      uv.emit('ecProductView')
      expect(handler.callCount).to.be(1)

      subscription.replay()
      expect(handler.callCount).to.be(1)
    })

    it('should not throw an error if dispose is called after the first call', function () {
      var subscription = uv.once('ecView', sinon.stub())
      subscription.dispose()

      expect(subscription.dispose).to.not.throwException()
    })
  })
})
