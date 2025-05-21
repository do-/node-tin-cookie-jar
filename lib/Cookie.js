const FIELDS = [
    'Domain',
    'Expires',
    'Secure',
    'Path',
].map (s => [s.toLowerCase (), s])

const PR_SECURE = Symbol ('Secure')

class Cookie {

    constructor (src) {

        this.src = src

        if (typeof src !== 'string') throw Error ('Invalid cookie source: ' + src)

        const {length} = src

        if (length < 3 || length > 32768) throw Error ('Invalid cookie source length: ' + length)

        let from = 0, to = 0; while (from < length) {

            to = src.indexOf (';', from); if (to < 0) to = length
            
            this.parseAV (src.slice (from, to).trim ())

			from = ++ to

		}

    }

    parseAV (av) {

        const posEq = av.indexOf ('='); if (posEq === -1) return this.parseAV1 (av)

        const name = av.substring (0, posEq), value = av.slice (posEq + 1)

        if (this.pair) return this.setOption (name.toLowerCase (), value)

        this.pair  = av
        this.name  = name

    }

    parseAV1 (part) {

        if (!this.pair) throw Error ('Invalid set-cookie: ' + src)

        if (part.toLowerCase () === 'secure') this [PR_SECURE] = true

    }

    get secure () {

        return this [PR_SECURE] ?? false

    }

    setOption (name, value) {

        switch (name) {

            case 'domain':
            case 'path':
                this [name] = value
                break

            case 'expires':
                const ts = Date.parse (value); if (!isNaN (ts)) this.expires = ts
                break

            case 'max-age':
                const ttl = parseInt (value); if (!isNaN (ttl)) this.expires = 1000 * (ttl + Math.floor (Date.now () / 1000))
                break

        }

    }

    get isExpired () {

        if (this.pair.length === this.name.length + 1) return true

        if (isNaN (this.expires)) return false

        return this.expires <= Date.now ()

    }

    equals (old) {

        for (const k of ['pair', 'expires']) if (this [k] != old [k]) return false

        return true

    }

    match ({protocol, origin, pathname}) {

        if (this.secure && !protocol.startsWith ('https')) return false

        if (this.domain && !origin.endsWith (this.domain)) return false

        if (this.path && !pathname.startsWith (this.path)) return false

        return true

    }

    get value () {

        return decodeURIComponent (this.pair.substring (this.name.length + 1))

    }

    toString () {

        let s = this.pair; for (const [lc, cc] of FIELDS) {

            let v = this [lc]; if (!v) continue

            s += `; ${cc}`

            if (lc === 'secure') continue

            if (lc === 'expires') v = new Date (v).toDateString ()

            s += `=${v}`

        }

        return s

    }

}

module.exports = Cookie