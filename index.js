const promisify = require('util').promisify
const extname = require('path').extname
const fs = require('fs')
const calculate = require('etag')

const stat = promisify(fs.stat)

const notfound = {
  ENOENT: true,
  ENAMETOOLONG: true,
  ENOTDIR: true
}

module.exports = async function sendfile (ctx, path) {
  try {
    const stats = await stat(path)

    if (!stats) return null
    if (!stats.isFile()) return stats

    ctx.response.status = 200
    ctx.response.lastModified = stats.mtime
    ctx.response.length = stats.size
    ctx.response.type = extname(path)

    if (!ctx.response.etag) {
      ctx.response.etag = calculate(stats, {
        weak: true
      })
    }

    // fresh based solely on last-modified
    switch (ctx.request.method) {
      case 'HEAD':
        ctx.status = ctx.request.fresh ? 304 : 200
        break
      case 'GET':
        if (ctx.request.fresh) {
          ctx.status = 304
        } else {
          ctx.body = fs.createReadStream(path)
        }
        break
    }

    return stats
  } catch (err) {
    if (notfound[err.code]) return
    err.status = 500
    throw err
  }
}
