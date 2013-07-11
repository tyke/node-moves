Moves API for Node
==========
This provides a wrapper to the [Moves API](https://dev.moves-app.com/docs/api). Please refer to the documentation before getting started. You'll need a [client](https://dev.moves-app.com/clients) before you can begin.

Install
-------
<pre>
npm install moves
</pre>

Oauth
=====
initialize with client information as created at (https://dev.moves-app.com/clients)
<pre>
  var Moves = require('moves')
    , moves = new Moves({
          client_id: 'your client id'
        , client_secret: 'your client secret'
        , redirect_uri: 'your redirect uri'
      })
</pre>

Start Auth Flow
---------------
**Either**
<pre>
  var authorize_url = moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: 'my_state' //optional state as per oauth
  })
</pre>
  
**Or**<br />
Optionally pass in an [Express Response Object](http://expressjs.com/api.html#response) and it will automatically redirect the user
<pre>
  moves.authorize({
      scope: ['activity', 'location'] //can contain either activity, location or both
    , state: 'my_state' //optional state as per oauth
  }, response)
</pre>

Retrieve a token
----------------
<pre>
  moves.token('code returned from authorize step above', function(error, response, body) {
    var access_token = body.access_token
      , refresh_token = body.refresh_token
      , expires_in = body.expires_in
  })
</pre>
  
Get information about a token
-----------------------------
<pre>
  moves.token_info(access_token, function(error, response, body) {
    
  })
</pre>
  
Refresh an access token
-----------------------
<pre>
  moves.refresh_token(refresh_token, function(error, response, body) {
  
  })
</pre>
  
Using the API
=============
Now that we have a valid access token, we can hit any endpoints that our token is correctly scoped to
<pre>
  moves.get('/user/profile', function(error, response, body) {
  
  })
  moves.get('/user/summary/daily?from=<from>&to=<to>', function(error, response, body) {
  
  })
</pre>
