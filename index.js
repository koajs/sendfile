
var extname = require('path').extname
var finished = require('finished')
var fs = require('fs')

var notfound = {
  ENOENT: true,
  ENAMETOOLONG: true,
  ENOTDIR: true,
}

module.exports = function* sendfile(path) {
  var stats
  try {
    stats = yield stat(path)
  } catch (err) {
    if (notfound[err.code]) return
    err.status = 500
    throw err
  }

  if (!stats.isFile()) return stats

  this.response.lastModified = stats.mtime
  this.response.length = stats.size
  this.response.type = extname(path)

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
        var stream = this.body = fs.createReadStream(path)
        // avoid any possible fd leaks
        finished(this, stream.destroy.bind(stream))
      }
      break
  }

  return stats
}

function stat(filename) {
  return function (done) {
    fs.stat(filename, done)
  }
}
