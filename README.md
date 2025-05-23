![workflow](https://github.com/do-/node-tin-cookie-jar/actions/workflows/main.yml/badge.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

`tin-cookie-jar` is a client side [cookie](https://datatracker.ietf.org/doc/html/rfc6265) library for data scraping and similar tasks.

# Motivation
At the start of this project, the node.js ecosystem already contained several modules implementing client side collections of [HTTP Cookies](https://datatracker.ietf.org/doc/html/rfc6265), informally named _cookie jars_. For instance:
* [`tough-cookie`](https://github.com/salesforce/tough-cookie): backed by [Salesforce](https://github.com/salesforce), this is a massively adopted, perfectly documented and (maybe even a bit overly) feature rich [ESM](https://nodejs.org/api/esm.html);
* [`cookiejar`](https://github.com/bmeck/node-cookiejar): a fairly popular [CommonJS](https://nodejs.org/api/modules.html) module doing the job, but barely described and not at all easy to learn by source code.

Having looked up for a tiny CJS cookie jar, fully covered by both documentation and tests, the author finally decided to make his own one.

# Installation
```sh
npm install tin-cookie-jar
```

# Usage
```js
const os   = require ('node:os')
const Path = require ('node:path')

///// Accessing to the API

const {
  CookieJar, 
//  Cookie            // just in case you want to subclass it
} = require ('tin-cookie-jar')

///// Initializing

const cookieJar = new CookieJar ({
   path        : Path.join (os.tmpdir (), 'myBotCookies.txt'),
// ttl         : 1,   // minute(s)
// cookieClass : class extends Cookie {/*...*/}
})
// .on ('insert', name => {if (name === 'NID') console.log ('It spies on me!')})

///// Getting cookies (authentication routine outline)

if (!cookieJar.get ('SESSIONID')) { // may be restored from file
  const authResult = await fetch (authUrl, authOptions)
  cookieJar.setCookies (authResult.headers.getSetCookie ())
}

///// Using known cookies in subsequent requests

const dataUrl = URL ('http...')
const dataResult = await fetch (dataUrl, {
  headers: {
    cookie: this.cookieJar.getCookieHeader (dataUrl), // dataUrl is for filtering on domain/path/secure
    //...
  },
  //...
})
```

# Description

The draft above almost completely describes the library's API. It's available via the [`CookieJar`](https://github.com/do-/node-tin-cookie-jar/wiki/CookieJar) class. The internal [`Cookie`](https://github.com/do-/node-tin-cookie-jar/wiki/Cookie) class is exposed too, but solely for the case when you'll want to extend it and to use your own `cookieClass`.

`CookieJar` persists its content using the synchronous file API. Some TEMP directory is always at hand and the overhead of writing a dozen lines once a second is considered totally negligible, so there was no apparent reason to make a memory only version nor to use a pluggable storage.

The file is written automatically, as a side effect of setting/getting cookies. It's loaded automatically too, by the constructor, unless the TTL is expired — in which case the outdated file is deleted and the `CookieJar` is created empty. So a script using the library, if interrupted and restarted shortly after, will recall cookies received in the past session.

`CookieJar` checks for cookies' expiry times during both get and set operations, and updates the file when changes occur. To implement this logic, but avoid redundant operations, `CookieJar` is made observable: on each change, an event is emitted, the handler sets up a common internal flag, the file is wrote is the flag is set. The API user is free to add custom handlers for those events for logging etc.
