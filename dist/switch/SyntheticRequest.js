// Generated by CoffeeScript 2.5.1
(function() {
  // This file is part of leanrc-arango-extension.

  // leanrc-arango-extension is free software: you can redistribute it and/or modify
  // it under the terms of the GNU Lesser General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.

  // leanrc-arango-extension is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU Lesser General Public License for more details.

  // You should have received a copy of the GNU Lesser General Public License
  // along with leanrc-arango-extension.  If not, see <https://www.gnu.org/licenses/>.

  // Класс намеренно подгоняется под интерфейс класса `SyntheticRequest` который используется в недрах аранги.
  // однако этот класс будет использоваться при формировании запросов между сервисами вместо http (в ArangoForeignCollectionMixin)
  var accepts, cookie, crypto, formatUrl, parseRange, parseUrl, querystring, typeIs;

  accepts = require('accepts');

  typeIs = require('type-is');

  parseRange = require('range-parser');

  cookie = require('cookie');

  querystring = require('querystring');

  parseUrl = require('url').parse;

  formatUrl = require('url').format;

  crypto = require('@arangodb/crypto');

  module.exports = function(Module) {
    var AnyT, CoreObject, FuncG, MaybeG, NilT, PointerT, SyntheticRequest, UnionG, _;
    ({
      AnyT,
      NilT,
      PointerT,
      FuncG,
      MaybeG,
      UnionG,
      CoreObject,
      Utils: {_}
    } = Module.prototype);
    return SyntheticRequest = (function() {
      var ipoParsedUrl, ipoUrlCache;

      class SyntheticRequest extends CoreObject {};

      SyntheticRequest.inheritProtected();

      SyntheticRequest.module(Module);

      ipoUrlCache = PointerT(SyntheticRequest.private({
        urlCache: MaybeG(Object)
      }));

      ipoParsedUrl = PointerT(SyntheticRequest.protected({
        parsedUrl: Object
      }, {
        get: function() {
          if (this[ipoUrlCache] == null) {
            this[ipoUrlCache] = parseUrl(this.initialUrl);
          }
          return this[ipoUrlCache];
        }
      }));

      SyntheticRequest.public({
        initialUrl: String
      });

      // @public arangoUser: String # not supported
      // @public arangoVersion: Number # not supported
      SyntheticRequest.public({
        baseUrl: String
      }, {
        get: function() {
          return this.context.baseUrl.replace(this.context.mount, '');
        }
      });

      SyntheticRequest.public({
        body: MaybeG(AnyT)
      });

      SyntheticRequest.public({
        context: Object
      });

      SyntheticRequest.public({
        database: String
      }, {
        get: function() {
          return this.baseUrl.replace('/_db/', '');
        }
      });

      SyntheticRequest.public({
        headers: Object
      });

      SyntheticRequest.public({
        hostname: String // copy from main request
      }, {
        default: '127.0.0.1'
      });

      SyntheticRequest.public({
        method: String
      });

      SyntheticRequest.public({
        originalUrl: String
      }, {
        get: function() {
          var ref;
          return `${this.baseUrl}/${this.path}${(ref = this[ipoParsedUrl].search) != null ? ref : ''}`;
        }
      });

      SyntheticRequest.public({
        path: String
      }, {
        get: function() {
          return this[ipoParsedUrl].pathname;
        }
      });

      SyntheticRequest.public({
        pathParams: MaybeG(Object)
      });

      SyntheticRequest.public({
        port: Number // copy from main request
      }, {
        default: 80
      });

      SyntheticRequest.public({
        protocol: String
      }, {
        default: 'http'
      });

      SyntheticRequest.public({
        queryParams: Object
      }, {
        get: function() {
          return querystring.decode(this[ipoParsedUrl].query);
        }
      });

      SyntheticRequest.public({
        rawBody: MaybeG(Buffer)
      });

      SyntheticRequest.public({
        remoteAddress: MaybeG(String) // copy from main request
      });

      SyntheticRequest.public({
        remoteAddresses: MaybeG(Array) // copy from main request
      });

      SyntheticRequest.public({
        remotePort: MaybeG(Number) // copy from main request
      });

      SyntheticRequest.public({
        secure: Boolean
      }, {
        get: function() {
          return this.protocol === 'https';
        }
      });

      // @public suffix: String # not supported
      SyntheticRequest.public({
        trustProxy: Boolean // copy from main request
      }, {
        default: false
      });

      // @public url: String,
      //   get: -> "#{@path}#{@[ipoParsedUrl].search ? ''}"
      SyntheticRequest.public({
        url: String
      });

      SyntheticRequest.public({
        xhr: Boolean
      }, {
        get: function() {
          var ref;
          return "xmlhttprequest" === ((ref = this.headers['x-requested-with']) != null ? ref.toLowerCase() : void 0);
        }
      });

      SyntheticRequest.public({
        accepts: FuncG([MaybeG(UnionG(String, Array))], UnionG(String, Array, Boolean))
      }, {
        default: function(...args) {
          var accept;
          accept = accepts(this);
          return accept.types(...args);
        }
      });

      SyntheticRequest.public({
        acceptsEncodings: FuncG([MaybeG(UnionG(String, Array))], UnionG(String, Array))
      }, {
        default: function(...args) {
          var accept;
          accept = accepts(this);
          return accept.encodings(...args);
        }
      });

      SyntheticRequest.public({
        acceptsCharsets: FuncG([MaybeG(UnionG(String, Array))], UnionG(String, Array))
      }, {
        default: function(...args) {
          var accept;
          accept = accepts(this);
          return accept.charsets(...args);
        }
      });

      SyntheticRequest.public({
        acceptsLanguages: FuncG([MaybeG(UnionG(String, Array))], UnionG(String, Array))
      }, {
        default: function(...args) {
          var accept;
          accept = accepts(this);
          return accept.languages(...args);
        }
      });

      SyntheticRequest.public({
        cookie: FuncG([String, UnionG(String, Object)], MaybeG(String))
      }, {
        default: function(name, opts) {
          var ciph, cookies, ref, sign, valid, value;
          if (_.isString(opts)) {
            opts = {
              secret: opts
            };
          } else if (!opts) {
            opts = {};
          }
          cookies = cookie.parse(this.headers.cookie);
          value = cookies[name];
          if (value && opts.secret) {
            sign = (ref = cookies[`${name}.sig`]) != null ? ref : '';
            ciph = crypto.hmac(opts.secret, value, opts.algorithm);
            valid = crypto.constantEquals(sign, ciph);
            if (!valid) {
              return void 0;
            }
          }
          return value;
        }
      });

      SyntheticRequest.public({
        get: FuncG(String, MaybeG(String))
      }, {
        default: function(name) {
          var lc, ref;
          lc = name.toLowerCase();
          if (lc === 'referer' || lc === 'referrer') {
            return (ref = this.headers.referer) != null ? ref : this.headers.referrer;
          }
          return this.headers[lc];
        }
      });

      SyntheticRequest.public({
        header: FuncG(String, MaybeG(String))
      }, {
        default: function(name) {
          return this.get(name);
        }
      });

      SyntheticRequest.public({
        'is': FuncG([UnionG(String, Array)], UnionG(String, Boolean, NilT))
      }, {
        default: function(...args) {
          var types;
          if (!this.headers['content-type']) {
            return false;
          }
          types = args.length === 1 ? args[0] : args;
          return typeIs.is(this, types);
        }
      });

      SyntheticRequest.public({
        json: FuncG([], Object)
      }, {
        default: function() {
          if (!this.rawBody || !this.rawBody.length) {
            void 0;
          }
          return JSON.parse(this.rawBody.toString('utf8'));
        }
      });

      SyntheticRequest.public({
        makeAbsolute: Function
      }, {
        default: function(path, query) {
          var opts;
          opts = {
            protocol: this.protocol,
            hostname: this.hostname,
            port: (this.secure ? this.port !== 443 : this.port !== 80) && this.port,
            pathname: `${this.baseUrl}${this.context.mount}/${path}`
          };
          if (query) {
            if (_.isString(query)) {
              opts.search = query;
            } else {
              opts.query = query;
            }
          }
          return formatUrl(opts);
        }
      });

      SyntheticRequest.public({
        param: FuncG(String, MaybeG(String))
      }, {
        default: function(name) {
          var hasOwnProperty;
          ({hasOwnProperty} = {});
          if (hasOwnProperty.call(this.pathParams, name)) {
            return this.pathParams[name];
          }
          return this.queryParams[name];
        }
      });

      SyntheticRequest.public({
        range: Function
      }, {
        default: function(size) {
          var range;
          range = this.headers.rang;
          if (!range) {
            return void 0;
          }
          size = size || size === 0 ? size : 2e308;
          return parseRange(size, this.headers.range);
        }
      });

      // @public reverse: Function, # not supported
      //   default: (name, params)->
      SyntheticRequest.public(SyntheticRequest.static(SyntheticRequest.async({
        restoreObject: Function
      }, {
        default: function*() {
          throw new Error(`restoreObject method not supported for ${this.name}`);
        }
      })));

      SyntheticRequest.public(SyntheticRequest.static(SyntheticRequest.async({
        replicateObject: Function
      }, {
        default: function*() {
          throw new Error(`replicateObject method not supported for ${this.name}`);
        }
      })));

      SyntheticRequest.public({
        init: Function
      }, {
        default: function(context) {
          this.super();
          this.context = context;
          this.pathParams = {};
        }
      });

      SyntheticRequest.initialize();

      return SyntheticRequest;

    }).call(this);
  };

}).call(this);
