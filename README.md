
# koa sendfile

Basic file-sending utility for koa. It does the following:

- Check if a file exists
- Set content-length, content-type, and last-modified headers
- 304 based on last-modified
- Handle HEAD requests

It does not:

- Check for malicious paths or hidden files
- Support directory indexes
- Cache control
- OPTIONS method

## API

### var stats = yield* sendfile.call(this, filename)

You must pass `this` as the context. `filename` is the filename of the file.

`stats` is the `fs.stat()` result of the filename. If `stats` exists, that doesn't mean that a response is set - the filename could be a directory. Instead, check `if (this.status)`.

```js
var sendfile = require('koa-sendfile')

app.use(function* (next) {
  var stats = yield* sendfile.call(this, '/Users/jong/.bash_profile')
  if (!this.status) this.throw(404)
})
```

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
