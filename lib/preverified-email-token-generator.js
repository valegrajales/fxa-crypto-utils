/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

var fs = require('fs');
var jwcrypto = require('jwcrypto');
require('jwcrypto/lib/algs/rs');
var b64 = require('jwcrypto/lib/utils').base64urlencode;

function invalidConfigError(msg) {
  throw new Error(msg);
}

function generateToken(email, jku, secretKey, kid, audience) {
  var header = b64(JSON.stringify({
      alg: 'RS256',
      jku: jku,
      kid: kid
  }));

  var payload = b64(JSON.stringify({
      exp: Date.now() + 10000,
      aud: audience,
      sub: email
  }));

  var sig = secretKey.sign(header + '.' + payload);
  var token = header + '.' + payload + '.' + sig;

  return token;
}

function PreverifiedEmailTokenGenerator(config) {
  config = config || {};

  if (config.keyPair) {
    this._keyPair = config.keyPair;
  } else {
    invalidConfigError('keyPair must be specified');
  }

  if (config.secretKeyId) {
    this._secretKeyId = config.secretKeyId;
  } else {
    invalidConfigError('secretKeyId must be specified');
  }

  if (config.audience) {
    this._audience = config.audience;
  } else {
    invalidConfigError('audience must be specified');
  }

  if (config.jku) {
    this._jku = config.jku;
  } else {
    invalidConfigError('jku must be specified');
  }
}

PreverifiedEmailTokenGenerator.prototype = {
  /**
   * Generate a preverified email token for the given email address.
   *
   * @param {string} email
   * @return {string} token
   */
  generate: function (email) {
    var self = this;

    return this._keyPair.getSecretKey()
      .then(function (secretKey) {
        return generateToken(email, self._jku, secretKey,
                               self._secretKeyId, self._audience);
      });
  }
};

module.exports = PreverifiedEmailTokenGenerator;