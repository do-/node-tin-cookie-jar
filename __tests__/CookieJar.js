const fs = require ('node:fs')
const os = require ('node:os')
const Path = require ('node:path')
const {randomUUID} = require ('node:crypto')
const {CookieJar} = require ('..')

test ('bad', () => {

 	expect (() => new CookieJar ()).toThrow ()
 	expect (() => new CookieJar ({})).toThrow ()
 	expect (() => new CookieJar ({path: 0})).toThrow ()
 	expect (() => new CookieJar ({path: ''})).toThrow ()

})

test ('empty', () => {

	const path = Path.join (os.tmpdir (), randomUUID () + '.txt'); clear = _ => fs.rmSync (path, {force: true})

	try {

		clear ()

		const j = new CookieJar ({path})

		expect (j.getCookieHeader (new URL ('http://my.com.com'))).toBe ('')

		j.setCookies (['sid=1'])

		expect (j.getCookieHeader (new URL ('http://my.com.com'))).toBe ('sid=1')
		expect (fs.existsSync (path)).toBe (true)

		j.delete ('sid')
		expect (j.getCookieHeader (new URL ('http://my.com.com'))).toBe ('')
		expect (fs.existsSync (path)).toBe (false)

	}
	finally {

		clear ()

	}

})

test ('old', () => {

	const path = Path.join (os.tmpdir (), randomUUID () + '.txt'); clear = _ => fs.rmSync (path, {force: true})

	try {

		clear ()

		fs.writeFileSync (path, 'sid=1\nsecret=2;    secure\ntmp=3;expires=' + new Date (1980, 1, 1))

		const ts = new Date (Date.now () - 61000)

		fs.utimesSync (path, ts, ts)

		const j = new CookieJar ({path, ttl: 1})

		expect (j.getCookieHeader (new URL ('http://my.com.com'))).toBe ('')

	}
	finally {

		clear ()

	}

})

test ('basic', () => {

	const path = Path.join (os.tmpdir (), randomUUID () + '.txt'); clear = _ => fs.rmSync (path, {force: true})

	try {

		clear ()

		fs.writeFileSync (path, 'sid=1\nsecret=2;    secure\ntmp=3;expires=' + new Date (1980, 1, 1))

		const j = new CookieJar ({path, ttl: 1})

		expect (j.getCookieHeader (new URL ('http://my.com.com'))).toBe ('sid=1')

		expect (fs.readFileSync (path).toString ()).toBe ('sid=1\nsecret=2; Secure')

		j.delete ('never_set')
		j.save (true)
		expect (fs.readFileSync (path).toString ()).toBe ('sid=1\nsecret=2; Secure')

		j.setCookies (['secret=2'])
		j.save (true)
		expect (fs.readFileSync (path).toString ()).toBe ('sid=1\nsecret=2; Secure')

		j.setCookies (['sid=111', 'secret=', 'SERVER=A; Max-Age=1000'])
		expect (j.getCookieHeader (new URL ('http://my.com.com'))).toBe ('sid=111; SERVER=A')
		expect (fs.readFileSync (path).toString ()).toMatch ('sid=111\nSERVER=A; Expires=')

		j.clear ()

		expect (fs.existsSync (path)).toBe (false)

	}
	finally {

		clear ()

	}

})
