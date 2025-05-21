const fs = require ('node:fs')
const EventEmitter = require ('node:events')
const Cookie = require ('./Cookie')

const EV_DELETE = 'delete'
const EV_INSERT = 'insert'
const EV_UPDATE = 'update'

class CookieJar extends EventEmitter {

    constructor (options) {

        super ()

        if (options == null || typeof options !== 'object') throw Error ('Invalid options: ' + options)

        {
            const {path} = options; if (typeof path !== 'string' || path.length === 0) throw Error ('Invalid options.path: ' + path)
            this.path = options.path
        }

        this.ttl  = options.ttl * 60 * 1000 || Infinity

        this.cookieClass = options.cookieClass || Cookie

        this.idx = {}
        this.reset ()
        
        const onChange = () => this.isChanged = true

        this.on (EV_DELETE, onChange)
        this.on (EV_INSERT, onChange)
        this.on (EV_UPDATE, onChange)

        this.load ()

    }

    reset () {

        this.isChanged = false

    }
    
    delete (name) {

        const {idx} = this; if (!(name in idx)) return

        delete idx [name]

        this.emit (EV_DELETE, name)

    }

    get (name) {

        const {idx} = this, cookie = idx [name]

        if (!cookie || !cookie.isExpired) return cookie

        this.delete (name)

    }

    parse (src) {

        const cookie = new (this.cookieClass) (src), {name} = cookie, {idx} = this

        const event = 
            !(name in idx)             ? EV_INSERT :
            cookie.isExpired           ? EV_DELETE :
            cookie.equals (idx [name]) ? null : 
            EV_UPDATE

        if (!event) return

        if (event === EV_DELETE) return this.delete (name)

        idx [name] = cookie

        this.emit (event, name)

    }

    setCookies (lines) {

        for (const line of lines) this.parse (line)

        this.save ()

    }

    * [Symbol.iterator] () {

        const {idx} = this; for (const name in idx) {

            const cookie = this.get (name)

            if (cookie) yield cookie

        }

    }

    getCookieHeader (url) {

        let s = ''; for (const cookie of this) if (cookie.match (url)) {

            if (s) s += '; '

            s += cookie.pair

        }

        this.save ()

        return s
        
    }

    load () {

        const {path} = this

        const stat = fs.statSync (path, {throwIfNoEntry: false}); if (!stat) return

        if ((Date.now () - stat.mtimeMs) > this.ttl) return fs.rmSync (path)

        this.setCookies (fs.readFileSync (this.path, {encoding: 'utf8'}).split ('\n'))

        this.reset ()

    }

    save (force = false) {

        if (!this.isChanged && !force) return

        const {path} = this

        let s = ''; for (const cookie of this) s += cookie + '\n'

        if (s) {

            fs.writeFileSync (path, s.trimEnd (), {encoding: 'utf8'})

        }
        else {

            fs.rmSync (path, {force: true})

        }

        this.reset ()

    }

    clear () {

        this.idx = {}
        
        this.save (true)

    }

}

module.exports = CookieJar