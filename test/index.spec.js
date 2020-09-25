const assert = require('assert')
const Koa = require('koa')
const promisify = require('util').promisify
const fs = require('fs')
const calculate = require('etag')
const request = require('supertest')

const sendfile = require('..')

const stat = promisify(fs.stat)

describe('when path is a directory', function () {
  it('should 404', function (done) {
    var app = new Koa()
    app.use(async function (ctx, next) {
      var stats = await sendfile(ctx, __dirname)
      assert.ok(stats)
    })

    request(app.listen())
      .get('/')
      .expect(404, done)
  })
})

describe('when path does not exist', function () {
  it('should 404', function (done) {
    var app = new Koa()
    app.use(async function (ctx, next) {
      var stats = await sendfile(ctx, `${__dirname}/kljasdlkfjaklsdf`)
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
      var app = new Koa()
      var stats, tag
      tag = stat(`${process.cwd()}/test/fixture.txt`)
      app.use(async function (ctx, next) {
        stats = await sendfile(ctx, `${process.cwd()}/test/fixture.txt`)
        assert.ok(stats)
        tag = calculate(stats, { weak: true })
      })

      request(app.listen())
        .get('/')
        .expect(200)
        .expect(/test/, function (err, res) {
          if (err) return done(err)

          assert(/text\/plain/.test(res.headers['content-type']))
          res.headers['content-length'].should.equal(String(stats.size))
          res.headers['last-modified'].should.equal(stats.mtime.toUTCString())
          res.headers.etag.should.equal(tag)

          done()
        })
    })

    it('should support weak etag 304', function (done) {
      var app = new Koa()
      stat(`${process.cwd()}/test/fixture.txt`).then(function (stat) {
        var tag = calculate(stat, {
          weak: true
        })

        app.use(async function (ctx, next) {
          var stats = await sendfile(ctx, `${process.cwd()}/test/fixture.txt`)
          assert.ok(stats)
        })

        request(app.listen())
          .get('/')
          .set('If-None-Match', tag)
          .expect(304, done)
      })
    })

    it('should support last-modified 304', function (done) {
      var app = new Koa()
      stat(`${process.cwd()}/test/fixture.txt`).then(function (stat) {
        app.use(async function (ctx, next) {
          var stats = await sendfile(ctx, `${process.cwd()}/test/fixture.txt`)
          assert.ok(stats)
        })

        request(app.listen())
          .get('/')
          .set('If-Modified-Since', stat.mtime.toUTCString())
          .expect(304, done)
      })
    })

    it('should cleanup on socket error', function (done) {
      var app = new Koa()
      var stream
      app.use(async function (ctx, next) {
        var stats = await sendfile(ctx, `${process.cwd()}/test/fixture.txt`)
        assert.ok(stats)
        stream = ctx.body
        ctx.socket.emit('error', new Error('boom'))
      })

      request(app.listen())
        .get('/')
        .end(function (err) {
          assert.ok(err || !err)
          assert.ok(stream.destroyed)
          done()
        })
    })
  })

  describe('when HEAD', function () {
    it('should 200', function (done) {
      var app = new Koa()
      app.use(async function (ctx, next) {
        const stats = await sendfile(ctx, `${process.cwd()}/test/fixture.txt`)
        assert.ok(stats)
      })

      request(app.listen())
        .head('/')
        .expect(200)
        .expect('content-type', /text\/plain/, done)
    })

    it('should 304', function (done) {
      var app = new Koa()
      stat(`${process.cwd()}/test/fixture.txt`).then(function (stat) {
        app.use(async function (ctx, next) {
          const stats = await sendfile(ctx, `${process.cwd()}/test/fixture.txt`)
          assert.ok(stats)
        })

        request(app.listen())
          .head('/')
          .set('If-Modified-Since', stat.mtime.toUTCString())
          .expect(304, done)
      })
    })
  })
})
