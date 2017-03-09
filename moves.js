var _ = require('underscore')
  , qs = require('querystring')
  , request = require('request')
  , url = require('url')
var Moves = module.exports = function(config_obj) {
    if(!(this instanceof Moves)) return new Moves(config_obj)

    var config = {
        oauth_base: 'https://api.moves-app.com/oauth/v1'
      , api_base: 'https://api.moves-app.com/api/1.1'
      , authorize_url: '/authorize'
    }

    this.config = _.extend(config, config_obj)
    this.http = request

    if(!this.config.client_id) throw new Error('Missing Client ID')
}

Moves.prototype.authorize = function(options, res) {
    options = options || {}

    if(typeof res === 'object'
    && typeof res.header !== 'function') throw new Error('authorize requires the first parameter to be a valid node response object')
    if(!options.scope)                   throw new Error('Scope is required')
    if(!_.isArray(options.scope))        throw new Error('Scope must be an array')

    var query = {
        client_id: this.config.client_id
      , response_type: 'code'
      , scope: options.scope.join(' ')
    }

    if(options.state) query.state = options.state
    if(options.redirect_uri) query.redirect_uri = options.redirect_uri

    var auth_url = this.config.oauth_base + this.config.authorize_url + '?' + qs.stringify(query)

    if(!res) return auth_url

    res.header('Content-Type', 'text/html')
    res.statusCode = 302
    res.header('Location', auth_url)
    res.end('Redirecting...')
}

Moves.prototype.token = function(code, callback) {
    if(!code)                          throw new Error('You must include a code')
    if(!this.config.client_secret)     throw new Error('Missing client secret')
    if(typeof callback !== 'function') throw new Error('Invalid callback')

    var query = {
        grant_type: 'authorization_code'
      , code: code
      , client_id: this.config.client_id
      , client_secret: this.config.client_secret
    }
    if(this.config.redirect_uri) query.redirect_uri = this.config.redirect_uri

    this.http.post(this.config.oauth_base + '/access_token?' + qs.stringify(query), callback)
}

Moves.prototype.refresh_token = function(token, scope, callback) {
    if(typeof scope === 'function' && !callback) {
        callback = scope
        scope = undefined
    }
    if(!token)                         throw new Error('You must include a token')
    if(!this.config.client_secret)     throw new Error('Missing client secret')
    if(typeof callback !== 'function') throw new Error('Invalid callback')

    var query = {
        grant_type: 'refresh_token'
      , refresh_token: token
      , client_id: this.config.client_id
      , client_secret: this.config.client_secret
    }
    if(scope) query.scope = scope

    this.http.post(this.config.oauth_base + '/access_token?' + qs.stringify(query), callback)
}

Moves.prototype.token_info = function(token, callback) {
    if(!token) throw new Error('You must include a token')

    var query = {
        access_token: token
    }

    this.http.get(this.config.oauth_base + '/tokeninfo?' + qs.stringify(query), callback)
}

Moves.prototype.get = function(call, access_token, callback) {
    if(!call) throw new Error('call is required. Please refer to the Moves docs <https://dev.moves-app.com/docs/api>')
    if(!access_token) throw new Error('Valid access token is required')

    var get_url = url.parse(this.config.api_base, true)
      , call_url = url.parse(call, true)

    get_url.pathname += call_url.pathname
    _.extend(get_url.query, call_url.query, {
        access_token: access_token
    })

    this.http.get(url.format(get_url), callback)

}
