
var koa = require('koa')
var assert = require('assert')
var request = require('supertest')

var sendfile = require('..')

describe('when path is a directory', function () {
  it('should 404', function (done) {
    var app = koa()
    app.use(function* (next) {
      var stats = yield* sendfile.call(this, __dirname)
      assert.ok(stats)
    })

    request(app.listen())
    .get('/')
    .expect(404, done)
  })
})

describe('when path does not exist', function () {
  it('should 404', function (done) {
    var app = koa()
    app.use(function* (next) {
      var stats = yield* sendfile.call(this, __dirname + '/kljasdlkfjaklsdf')
      assert.ok(!stats)
    })

    request(app.listen())
    .get('/')
    .expect(404, done)
  })
})

describe('when path exists', function () {
  describe('when GET', function () {
    it('should send the file', function (done) {
      var app = koa()
      var stats
      app.use(function* (next) {
        stats = yield* sendfile.call(this, process.cwd() + '/index.js')
        assert.ok(stats)
      })

      request(app.listen())
      .get('/')
      .expect(200)
      .expect(/module\.exports/, function (err, res) {
        if (err) return done(err)

        res.headers['content-type'].should.equal('application/javascript')
        res.headers['content-length'].should.equal(String(stats.size))
        res.headers['last-modified'].should.equal(stats.mtime.toUTCString())

        done()
      })
    })

    it('should cleanup on socket error', function (done) {
      var app = koa()
      var stream
      app.use(function* (next) {
        var stats = yield* sendfile.call(this, process.cwd() + '/index.js')
        assert.ok(stats)
        stream = this.body
        this.socket.emit('error', new Error('boom'))
      })

      request(app.listen())
      .get('/')
      .end(function (err) {
        assert.ok(err)
        assert.ok(stream.destroyed)
        done()
      })
    })
  })

  describe('when HEAD', function () {
    it('should 200', function (done) {
      var app = koa()
      app.use(function* (next) {
        var stats = yield* sendfile.call(this, process.cwd() + '/index.js')
        assert.ok(stats)
      })

      request(app.listen())
      .head('/')
      .expect(200)
      .expect('content-type', 'application/javascript')
      .expect('', done)
    })
  })
})