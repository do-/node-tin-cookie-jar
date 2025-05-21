const {Cookie} = require ('..')

test ('bad', () => {

	expect (() => new Cookie ()).toThrow ()
	expect (() => new Cookie (0)).toThrow ()
	expect (() => new Cookie ('')).toThrow ()
	expect (() => new Cookie ('Secure')).toThrow ()
	expect (() => new Cookie (' '.repeat (100000))).toThrow ()

})

test ('value', () => {

	expect ((new Cookie ('sid=1')).value).toBe ('1')

})

test ('domain', () => {

	expect ((new Cookie ('sid=1')).domain).toBeUndefined ()
	expect ((new Cookie ('sid=1; Domain=.com.com; Path=/root')).domain).toBe ('.com.com')

})

test ('path', () => {

	expect ((new Cookie ('sid=1')).domain).toBeUndefined ()
	expect ((new Cookie ('sid=1; Domain=.com.com; Path=/root')).path).toBe ('/root')

})

test ('equals', () => {

	expect ((new Cookie ('sid=1').equals (new Cookie ('sid=1')))).toBe (true)
	expect ((new Cookie ('sid=1').equals (new Cookie ('sid=2')))).toBe (false)
	expect ((new Cookie ('sid=1; Expires=' + new Date ()).equals (new Cookie ('sid=1; Max-Age=0')))).toBe (true)

})

test ('secure', () => {

	expect ((new Cookie ('sid=1')).secure).toBe (false)
	expect ((new Cookie ('sid=1; Secure')).secure).toBe (true)

})

test ('isExpired', () => {

	expect ((new Cookie ('sid=1')).isExpired).toBe (false)
	expect ((new Cookie ('sid=')).isExpired).toBe (true)

	expect ((new Cookie ('sid=1; Max-Age=10')).isExpired).toBe (false)
	expect ((new Cookie ('sid=1; Max-Age=0')).isExpired).toBe (true)
	expect ((new Cookie ('sid=1; Max-Age=?')).isExpired).toBe (false)

	expect ((new Cookie ('sid=1; Expires=' + new Date (1980, 1, 1))).isExpired).toBe (true)
	expect ((new Cookie ('sid=1; Expires=' + new Date (10000 + Date.now ()))).isExpired).toBe (false)
	expect ((new Cookie ('sid=1; Expires=')).isExpired).toBe (false)

})


test ('match', () => {

	expect ((new Cookie ('sid=1')).match (new URL ('http://my.com.com/about'))).toBe (true)
	expect ((new Cookie ('sid=1; Secure')).match (new URL ('http://my.com.com/about'))).toBe (false)
	expect ((new Cookie ('sid=1; Secure')).match (new URL ('https://my.com.com/about'))).toBe (true)

	expect ((new Cookie ('sid=1; Domain=.com.com')).match (new URL ('http://my.com.com/about'))).toBe (true)
	expect ((new Cookie ('sid=1; Domain=.com.com')).match (new URL ('http://my.com.org/about'))).toBe (false)
	
	expect ((new Cookie ('sid=1; Path=/root')).match (new URL ('http://my.com.com/about'))).toBe (false)
	expect ((new Cookie ('sid=1; Path=/root')).match (new URL ('http://my.com.com/root/about'))).toBe (true)

})

test ('toString', () => {

	expect (String (new Cookie ('sid=1;    secure'))).toBe ('sid=1; Secure')

	const s = String (new Cookie ('sid=1;Max-Age=10;HttpOnly;    Path=/root'))

	expect (s).toMatch (/^sid=1;/)
	expect (s).toMatch ('; Expires=')
	expect (s).toMatch ('; Path=/root')

})
