var should = require('should')
  , _ = require('underscore')
  , Moves = require('../moves')
  , qs = require('querystring')
  , url = require('url')

describe('initialization', function() {
    it('should require client id be set', function() {
        try {
            var moves = Moves()
        } catch(e) {
            e.message.should.equal('Missing Client ID')
        }
    })
    it('should create new instance automatically', function() {
        var moves = Moves({ client_id: '123' })
        moves.should.be.a('object')
    })
    it('should have default values', function() {
        var moves = Moves({ client_id: '123' })
        moves.config.should.have.property('api_base', 'https://api.moves-app.com/api/v1')
        moves.config.should.have.property('oauth_base', 'https://api.moves-app.com/oauth/v1')
        moves.config.should.have.property('authorize_url', '/authorize')
    })
    it('should have allow overrides of default values', function() {
        var moves = Moves({
            api_base: 'http://example.com'
          , oauth_base: 'http://example.com'
          , authorize_url: '/auth'
          , client_id: '123'
        })
        moves.config.should.have.property('api_base', 'http://example.com')
        moves.config.should.have.property('oauth_base', 'http://example.com')
        moves.config.should.have.property('authorize_url', '/auth')
    })
    it('http should exist', function() {
        var moves = Moves({
            client_id: '123'
        })
        moves.http.should.be.a('function')
    })
})
describe('authorize', function() {
    var moves
    beforeEach(function() {
        moves = Moves({
            client_id: '123'
        })
    })
    it('should not require a response object passed as second argument', function() {
        try {
            moves.authorize()
        } catch(e) {
            e.message.should.equal('Scope is required')
        }
    })
    it('should optionally accept response object, but require it to have a header method', function() {
        try {
            moves.authorize({}, {
                no_header_method: function() {}
            })
        } catch(e) {
            e.message.should.equal('authorize requires the first parameter to be a valid node response object')
        }
    })
    it('should require scope to be an array', function() {
        try {
            moves.authorize({
                scope: 'string'
            })
        } catch(e) {
            e.message.should.equal('Scope must be an array')
        }
    })
    it('should require scope', function() {
        try {
            moves.authorize({})
        } catch(e) {
            e.message.should.equal('Scope is required')
        }
    })
    it('should correctly format scope', function() {
        moves.authorize({
            scope: ['my_scope']
        }).should.equal(moves.config.oauth_base + moves.config.authorize_url + '?client_id=123&response_type=code&scope=my_scope')
        moves.authorize({
            scope: ['my_scope', 'my_scope_2']
        }).should.equal(moves.config.oauth_base + moves.config.authorize_url + '?client_id=123&response_type=code&scope=my_scope%20my_scope_2')
    })
    it('should optionally include state', function() {
        moves.authorize({
            scope: ['my_scope']
          , state: 'my_state'
        }).should.equal(moves.config.oauth_base + moves.config.authorize_url + '?client_id=123&response_type=code&scope=my_scope&state=my_state')
    })
    it('should optionally include redirect_uri', function() {
        var qs = require('querystring')
        moves.authorize({
            scope: ['my_scope']
          , redirect_uri: 'http://example.com'
        }).should.equal(moves.config.oauth_base + moves.config.authorize_url + '?client_id=123&response_type=code&scope=my_scope&redirect_uri='+qs.escape('http://example.com'))
    })
    it('should redirect correctly if express object passed in', function(done) {
        var res = function() {
            this.headers = {}
        }
        res.prototype.header = function(key, val) {
            this.headers[key] = val
        }
        res.prototype.end = function(string) {
            string.should.equal('Redirecting...')
            this.headers['Content-Type'].should.equal('text/html')
            this.headers['Location'].should.equal(moves.config.oauth_base + moves.config.authorize_url + '?client_id=123&response_type=code&scope=my_scope')
            this.statusCode.should.equal(302)
            done()
        }
        moves.authorize({
            scope: ['my_scope']
        }, new res())
    })
})
describe('token', function() {
    var moves
    beforeEach(function() {
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
    })
    it('should require code', function() {
        try {
            moves.token('', function() { })
        } catch(e) {
            e.message.should.equal('You must include a code')
        }
    })
    it('should require client secret', function() {
        moves = Moves({
            client_id: 'id'
        })
        try {
            moves.token('code', function() { })
        } catch(e) {
            e.message.should.equal('Missing client secret')
        }
    })
    it('should require callback', function() {
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
        try {
            moves.token('code')
        } catch(e) {
            e.message.should.equal('Invalid callback')
        }
    })
    it('should let redirect uri be optional', function(done) {
        moves.http.post = function(_url, callback) {
            var parsed = url.parse(_url, true)
            parsed.query.grant_type.should.equal('authorization_code')
            parsed.query.client_id.should.equal('id')
            parsed.query.client_secret.should.equal('secret')
            parsed.query.code.should.equal('code')
            should.not.exist(parsed.query.redirect_uri)
            done()
        }
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
        moves.token('code', function(){})
    })
    it('should optionally accept a redirect uri', function(done) {
        moves.http.post = function(_url, callback) {
            var parsed = url.parse(_url, true)
            parsed.query.grant_type.should.equal('authorization_code')
            parsed.query.client_id.should.equal('id')
            parsed.query.client_secret.should.equal('secret')
            parsed.query.code.should.equal('code')
            parsed.query.redirect_uri.should.equal('http://example.com')
            done()
        }
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
          , redirect_uri: 'http://example.com'
        })
        moves.token('code', function(){})
    })
})
describe('refresh token', function() {
    var moves
    beforeEach(function() {
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
    })
    it('should require token', function() {
        try {
            moves.refresh_token('', function() { })
        } catch(e) {
            e.message.should.equal('You must include a token')
        }
    })
    it('should require client secret', function() {
        moves = Moves({
            client_id: 'id'
        })
        try {
            moves.refresh_token('token', 'scope', function() { })
        } catch(e) {
            e.message.should.equal('Missing client secret')
        }
    })
    it('should require callback', function() {
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
        try {
            moves.refresh_token('token')
        } catch(e) {
            e.message.should.equal('Invalid callback')
        }
    })
    it('should format correctly without scope', function(done) {
        moves.http.post = function(_url, callback) {
            var parsed = url.parse(_url, true)
            parsed.query.grant_type.should.equal('refresh_token')
            parsed.query.client_id.should.equal('id')
            parsed.query.client_secret.should.equal('secret')
            parsed.query.refresh_token.should.equal('token')
            should.not.exist(parsed.query.scope)
            callback()
        }
        moves.refresh_token('token', done)
    })
    it('should optionally accept a scope', function(done) {
        moves.http.post = function(_url, callback) {
            var parsed = url.parse(_url, true)
            parsed.query.grant_type.should.equal('refresh_token')
            parsed.query.client_id.should.equal('id')
            parsed.query.client_secret.should.equal('secret')
            parsed.query.refresh_token.should.equal('token')
            parsed.query.scope.should.equal('scope')
            callback()
        }
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
        moves.refresh_token('token', 'scope', done)
    })
})
describe('token info', function() {
    var moves
    beforeEach(function() {
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
    })
    it('must require token', function() {
        try {
            moves.token_info('', function(){})
        } catch(e) {
            e.message.should.equal('You must include a token')
        }
    })

    it('should correctly format tokeninfo call', function(done) {
        moves.http.get = function(_url, callback) {
            _url.should.equal(moves.config.oauth_base + '/tokeninfo?access_token=my_token')
            callback()
        }
        moves.token_info('my_token', done)
    })
})
describe('get endpoint', function() {
    var moves
    beforeEach(function() {
        moves = Moves({
            client_id: 'id'
          , client_secret: 'secret'
        })
    })
    it('should require valid call endpoint', function() {
        try {
            moves.get('', '', function(){})
        } catch(e) {
            e.message.should.equal('call is required. Please refer to the Moves docs <https://dev.moves-app.com/docs/api>')
        }
    })
    it('should require valid call endpoint', function() {
        try {
            moves.get('/user/profile', '', function(){})
        } catch(e) {
            e.message.should.equal('Valid access token is required')
        }
    })
    it('should correctly format get call', function(done) {
        moves.http.get = function(_url, callback) {
            _url.should.equal(moves.config.api_base+'/user/profile?access_token=access_token')
            callback()
        }
        moves.get('/user/profile', 'access_token', done)
    })
    it('should handle calls with get params', function(done) {
        moves.http.get = function(_url, callback) {
            _url.should.equal(moves.config.api_base+'/user/summary/daily?from=0&to=1&access_token=access_token')
            callback()
        }
        moves.get('/user/summary/daily?from=0&to=1', 'access_token', done)
    })
})
