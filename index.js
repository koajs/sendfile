
var extname = require('path').extname
var calculate = require('etag')
var fs = require('mz/fs')

var notfound = {
  ENOENT: true,
  ENAMETOOLONG: true,
  ENOTDIR: true,
}

module.exports = function* sendfile(path) {
  var stats = yield fs.stat(path).catch(onstaterror)
  if (!stats) return null
  if (!stats.isFile()) return stats

  this.response.lastModified = stats.mtime
  this.response.length = stats.size
  this.response.type = extname(path)
  if (!this.response.etag) this.response.etag = calculate(stats, {
    weak: true
  })

  // fresh based solely on last-modified
  var fresh = this.request.fresh
  switch (this.request.method) {
    case 'HEAD':
      this.response.status = fresh ? 304 : 200
      break
    case 'GET':
      if (fresh) {
        this.response.status = 304
      } else {
        this.body = fs.createReadStream(path)
      }
      break
  }

  return stats
}

function onstaterror(err) {
  if (notfound[err.code]) return
  err.status = 500
  throw err
}
