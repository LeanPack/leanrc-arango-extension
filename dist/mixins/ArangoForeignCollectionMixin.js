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

  // AISC - Arango Inter-Service Communication
  // этот миксин нужен, чтобы объявить медиатор, который будет предоставлять доступ к апи для клиентов, которые так же как этот запущены на платформе ArangoDB как микросервисы.
  // для того чтобы обратиться из клиентского модуля к этому сервису будет использоваться обращение через module.context.dependencies....
  // а с этой стороны модуля за взаимодействие будет отвечать этот медиатор
  // по сути он просто будет врапить хендлеры (экшены) которые объявляются в Stock классах, или делать что-то эквивалентное.

  // TODO: надо переадаптировать этот миксин в ...CollectionMixin чтобы за данными обращаться из коллекции сквозь прослойки аранги напрямую к работающему сервису.

  // TODO: !!!! Поначалу было опасно начинать этот миксин, т.к. можно было закопаться с вычислением локов (т.к. транзакция открывалась в switch классе), но после того, как открытие транзакции было перенесено в ресурс. можно за это не переживать. Т.е. можно при появлении свободного времени взяться за реализацию этого миксина
  var semver,
    hasProp = {}.hasOwnProperty;

  semver = require('semver');

  module.exports = function(Module) {
    var APPLICATION_MEDIATOR, APPLICATION_SWITCH, AnyT, Collection, Cursor, CursorInterface, DEBUG, DictG, EnumG, FuncG, InterfaceG, LEVELS, ListG, MaybeG, Mixin, PointerT, QueryInterface, RecordInterface, SEND_TO_LOG, StructG, UnionG, _, inflect;
    ({
      APPLICATION_SWITCH,
      APPLICATION_MEDIATOR,
      AnyT,
      PointerT,
      FuncG,
      UnionG,
      MaybeG,
      EnumG,
      ListG,
      StructG,
      DictG,
      InterfaceG,
      RecordInterface,
      CursorInterface,
      QueryInterface,
      Mixin,
      Collection,
      Cursor,
      LogMessage: {SEND_TO_LOG, LEVELS, DEBUG},
      Utils: {_, inflect}
    } = Module.prototype);
    return Module.defineMixin(Mixin('ArangoForeignCollectionMixin', function(BaseClass = Collection) {
      return (function() {
        var _Class, ipsRecordMultipleName, ipsRecordSingleName;

        _Class = class extends BaseClass {};

        _Class.inheritProtected();

        ipsRecordMultipleName = PointerT(_Class.private({
          recordMultipleName: MaybeG(String)
        }));

        ipsRecordSingleName = PointerT(_Class.private({
          recordSingleName: MaybeG(String)
        }));

        _Class.public({
          recordMultipleName: FuncG([], String)
        }, {
          default: function() {
            return this[ipsRecordMultipleName] != null ? this[ipsRecordMultipleName] : this[ipsRecordMultipleName] = inflect.pluralize(this.recordSingleName());
          }
        });

        _Class.public({
          recordSingleName: FuncG([], String)
        }, {
          default: function() {
            return this[ipsRecordSingleName] != null ? this[ipsRecordSingleName] : this[ipsRecordSingleName] = inflect.underscore(this.delegate.name.replace(/Record$/, ''));
          }
        });

        _Class.public(_Class.async({
          push: FuncG(RecordInterface, RecordInterface)
        }, {
          default: function*(aoRecord) {
            var body, params, request, res, voRecord;
            params = {};
            params.requestType = 'push';
            params.recordName = this.delegate.name;
            params.snapshot = (yield this.serialize(aoRecord));
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              voRecord = (yield this.normalize(body[this.recordSingleName()]));
            } else {
              throw new Error("Record payload has not existed in response body.");
            }
            return voRecord;
          }
        }));

        _Class.public(_Class.async({
          remove: FuncG([UnionG(String, Number)])
        }, {
          default: function*(id) {
            var params, request, res;
            params = {};
            params.requestType = 'remove';
            params.recordName = this.delegate.name;
            params.id = id;
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
          }
        }));

        _Class.public(_Class.async({
          take: FuncG([UnionG(String, Number)], RecordInterface)
        }, {
          default: function*(id) {
            var body, params, request, res, voRecord;
            params = {};
            params.requestType = 'take';
            params.recordName = this.delegate.name;
            params.id = id;
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              voRecord = (yield this.normalize(body[this.recordSingleName()]));
            } else {
              throw new Error("Record payload has not existed in response body.");
            }
            return voRecord;
          }
        }));

        _Class.public(_Class.async({
          takeBy: FuncG([Object, MaybeG(Object)], CursorInterface)
        }, {
          default: function*(query, options = {}) {
            var body, params, request, res, vhRecordsData, voCursor;
            params = {};
            params.requestType = 'takeBy';
            params.recordName = this.delegate.name;
            params.query = {
              $filter: query
            };
            if (options.$sort != null) {
              params.query.$sort = options.$sort;
            }
            if (options.$limit != null) {
              params.query.$limit = options.$limit;
            }
            if (options.$offset != null) {
              params.query.$offset = options.$offset;
            }
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              vhRecordsData = body[this.recordMultipleName()];
              voCursor = Cursor.new(this, vhRecordsData);
            } else {
              throw new Error("Record payload has not existed in response body.");
            }
            return voCursor;
          }
        }));

        _Class.public(_Class.async({
          takeMany: FuncG([ListG(UnionG(String, Number))], CursorInterface)
        }, {
          default: function*(ids) {
            var body, params, request, res, vhRecordsData, voCursor;
            params = {};
            params.requestType = 'takeBy';
            params.recordName = this.delegate.name;
            params.query = {
              $filter: {
                '@doc.id': {
                  $in: ids
                }
              }
            };
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              vhRecordsData = body[this.recordMultipleName()];
              voCursor = Cursor.new(this, vhRecordsData);
            } else {
              throw new Error("Record payload has not existed in response body.");
            }
            return voCursor;
          }
        }));

        _Class.public(_Class.async({
          takeAll: FuncG([], CursorInterface)
        }, {
          default: function*() {
            var body, params, request, res, vhRecordsData, voCursor;
            params = {};
            params.requestType = 'takeAll';
            params.recordName = this.delegate.name;
            params.query = {};
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              vhRecordsData = body[this.recordMultipleName()];
              voCursor = Cursor.new(this, vhRecordsData);
            } else {
              throw new Error("Record payload has not existed in response body.");
            }
            return voCursor;
          }
        }));

        _Class.public(_Class.async({
          override: FuncG([UnionG(String, Number), RecordInterface], RecordInterface)
        }, {
          default: function*(id, aoRecord) {
            var body, params, request, res, voRecord;
            params = {};
            params.requestType = 'override';
            params.recordName = this.delegate.name;
            params.snapshot = (yield this.serialize(aoRecord));
            params.id = id;
            request = this.requestFor(params);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              voRecord = (yield this.normalize(body[this.recordSingleName()]));
            } else {
              throw new Error("Record payload has not existed in response body.");
            }
            return voRecord;
          }
        }));

        _Class.public(_Class.async({
          includes: FuncG([UnionG(String, Number)], Boolean)
        }, {
          default: function*(id) {
            var voQuery;
            voQuery = {
              $forIn: {
                '@doc': this.collectionFullName()
              },
              $filter: {
                '@doc.id': {
                  $eq: id
                }
              },
              $limit: 1,
              $return: '@doc'
            };
            return (yield ((yield this.query(voQuery))).hasNext());
          }
        }));

        _Class.public(_Class.async({
          length: FuncG([], Number)
        }, {
          default: function*() {
            var voQuery;
            voQuery = {
              $forIn: {
                '@doc': this.collectionFullName()
              },
              $count: true
            };
            return (yield ((yield this.query(voQuery))).first());
          }
        }));

        _Class.public({
          headers: MaybeG(DictG(String, String))
        });

        _Class.public({
          host: String
        }, {
          default: 'http://127.0.0.1'
        });

        _Class.public({
          dependencyName: String
        });

        _Class.public({
          namespace: String
        }, {
          get: function() {
            var conf;
            conf = this.Module.context().manifest.dependencies[this.dependencyName];
            return conf.version;
          }
        });

        _Class.public({
          queryEndpoint: String
        }, {
          default: 'query'
        });

        _Class.public({
          headersForRequest: FuncG(MaybeG(InterfaceG({
            requestType: String,
            recordName: String,
            snapshot: MaybeG(Object),
            id: MaybeG(String),
            query: MaybeG(Object),
            isCustomReturn: MaybeG(Boolean)
          })), DictG(String, String))
        }, {
          default: function(params) {
            var headers, ref, ref1, ref2, service, sessionCookie;
            headers = (ref = this.headers) != null ? ref : {};
            headers['Accept'] = 'application/json';
            if ((ref1 = params.requestType) === 'query' || ref1 === 'patchBy' || ref1 === 'removeBy') {
              headers['Authorization'] = `Bearer ${this.configs.apiKey}`;
            } else {
              if ((ref2 = params.requestType) === 'takeAll' || ref2 === 'takeBy') {
                headers['NonLimitation'] = this.configs.apiKey;
              }
              service = this.facade.retrieveMediator(APPLICATION_MEDIATOR).getViewComponent();
              if (service.context != null) {
                if (service.context.headers['authorization'] === `Bearer ${this.configs.apiKey}`) {
                  headers['Authorization'] = `Bearer ${this.configs.apiKey}`;
                } else {
                  sessionCookie = service.context.cookies.get(this.configs.sessionCookie);
                  headers['Cookie'] = `${this.configs.sessionCookie}=${sessionCookie}`;
                }
              } else {
                headers['Authorization'] = `Bearer ${this.configs.apiKey}`;
              }
            }
            return headers;
          }
        });

        _Class.public({
          methodForRequest: FuncG(InterfaceG({
            requestType: String,
            recordName: String,
            snapshot: MaybeG(Object),
            id: MaybeG(String),
            query: MaybeG(Object),
            isCustomReturn: MaybeG(Boolean)
          }), String)
        }, {
          default: function({requestType}) {
            switch (requestType) {
              case 'query':
                return 'POST';
              case 'patchBy':
                return 'POST';
              case 'removeBy':
                return 'POST';
              case 'takeAll':
                return 'GET';
              case 'takeBy':
                return 'GET';
              case 'take':
                return 'GET';
              case 'push':
                return 'POST';
              case 'remove':
                return 'DELETE';
              case 'override':
                return 'PUT';
              default:
                return 'GET';
            }
          }
        });

        _Class.public({
          dataForRequest: FuncG(InterfaceG({
            requestType: String,
            recordName: String,
            snapshot: MaybeG(Object),
            id: MaybeG(String),
            query: MaybeG(Object),
            isCustomReturn: MaybeG(Boolean)
          }), MaybeG(Object))
        }, {
          default: function({recordName, snapshot, requestType, query}) {
            if ((snapshot != null) && (requestType === 'push' || requestType === 'override')) {
              return snapshot;
            } else if (requestType === 'query' || requestType === 'patchBy' || requestType === 'removeBy') {
              return {query};
            } else {

            }
          }
        });

        _Class.public({
          urlForRequest: FuncG(InterfaceG({
            requestType: String,
            recordName: String,
            snapshot: MaybeG(Object),
            id: MaybeG(String),
            query: MaybeG(Object),
            isCustomReturn: MaybeG(Boolean)
          }), String)
        }, {
          default: function(params) {
            var id, query, recordName, requestType, snapshot;
            ({recordName, snapshot, id, requestType, query} = params);
            return this.buildURL(recordName, snapshot, id, requestType, query);
          }
        });

        _Class.public({
          pathForType: FuncG(String, String)
        }, {
          default: function(recordName) {
            return inflect.pluralize(inflect.underscore(recordName.replace(/Record$/, '')));
          }
        });

        _Class.public({
          urlPrefix: FuncG([MaybeG(String), MaybeG(String)], String)
        }, {
          default: function(path, parentURL) {
            var url;
            if (!this.host || this.host === '/') {
              this.host = '';
            }
            if (path) {
              // Protocol relative url
              if (/^\/\//.test(path) || /http(s)?:\/\//.test(path)) {
                // Do nothing, the full @host is already included.
                return path;
              // Absolute path
              } else if (path.charAt(0) === '/') {
                return `${this.host}${path}`;
              } else {
                // Relative path
                return `${parentURL}/${path}`;
              }
            }
            // No path provided
            url = [];
            if (this.host) {
              url.push(this.host);
            }
            if (this.namespace) {
              url.push(this.namespace);
            }
            return url.join('/');
          }
        });

        _Class.public({
          makeURL: FuncG([String, MaybeG(Object), MaybeG(UnionG(Number, String)), MaybeG(Boolean)], String)
        }, {
          default: function(recordName, query, id, isQueryable) {
            var path, prefix, url;
            url = [];
            prefix = this.urlPrefix();
            if (recordName) {
              path = this.pathForType(recordName);
              if (path) {
                url.push(path);
              }
            }
            if (isQueryable && (this.queryEndpoint != null)) {
              url.push(encodeURIComponent(this.queryEndpoint));
            }
            if (prefix) {
              url.unshift(prefix);
            }
            if (id != null) {
              url.push(id);
            }
            url = url.join('/');
            if (!this.host && url && url.charAt(0) !== '/') {
              url = '/' + url;
            }
            if (query != null) {
              query = encodeURIComponent(JSON.stringify(query != null ? query : ''));
              url += `?query=${query}`;
            }
            return url;
          }
        });

        _Class.public({
          urlForQuery: FuncG([String, MaybeG(Object)], String)
        }, {
          default: function(recordName, query) {
            return this.makeURL(recordName, null, null, true);
          }
        });

        _Class.public({
          urlForPatchBy: FuncG([String, MaybeG(Object)], String)
        }, {
          default: function(recordName, query) {
            return this.makeURL(recordName, null, null, true);
          }
        });

        _Class.public({
          urlForRemoveBy: FuncG([String, MaybeG(Object)], String)
        }, {
          default: function(recordName, query) {
            return this.makeURL(recordName, null, null, true);
          }
        });

        _Class.public({
          urlForTakeAll: FuncG([String, MaybeG(Object)], String)
        }, {
          default: function(recordName, query) {
            return this.makeURL(recordName, query, null, false);
          }
        });

        _Class.public({
          urlForTakeBy: FuncG([String, MaybeG(Object)], String)
        }, {
          default: function(recordName, query) {
            return this.makeURL(recordName, query, null, false);
          }
        });

        _Class.public({
          urlForTake: FuncG([String, String], String)
        }, {
          default: function(recordName, id) {
            return this.makeURL(recordName, null, id, false);
          }
        });

        _Class.public({
          urlForPush: FuncG([String, Object], String)
        }, {
          default: function(recordName, snapshot) {
            return this.makeURL(recordName, null, null, false);
          }
        });

        _Class.public({
          urlForRemove: FuncG([String, String], String)
        }, {
          default: function(recordName, id) {
            return this.makeURL(recordName, null, id, false);
          }
        });

        _Class.public({
          urlForOverride: FuncG([String, Object, String], String)
        }, {
          default: function(recordName, snapshot, id) {
            return this.makeURL(recordName, null, id, false);
          }
        });

        _Class.public({
          buildURL: FuncG([String, MaybeG(Object), MaybeG(String), String, MaybeG(Object)], String)
        }, {
          default: function(recordName, snapshot, id, requestType, query) {
            var vsMethod;
            switch (requestType) {
              case 'query':
                return this.urlForQuery(recordName, query);
              case 'patchBy':
                return this.urlForPatchBy(recordName, query);
              case 'removeBy':
                return this.urlForRemoveBy(recordName, query);
              case 'takeAll':
                return this.urlForTakeAll(recordName, query);
              case 'takeBy':
                return this.urlForTakeBy(recordName, query);
              case 'take':
                return this.urlForTake(recordName, id);
              case 'push':
                return this.urlForPush(recordName, snapshot);
              case 'remove':
                return this.urlForRemove(recordName, id);
              case 'override':
                return this.urlForOverride(recordName, snapshot, id);
              default:
                vsMethod = `urlFor${inflect.camelize(requestType)}`;
                return typeof this[vsMethod] === "function" ? this[vsMethod](recordName, query, snapshot, id) : void 0;
            }
          }
        });

        _Class.public({
          requestFor: FuncG(InterfaceG({
            requestType: String,
            recordName: String,
            snapshot: MaybeG(Object),
            id: MaybeG(String),
            query: MaybeG(Object),
            isCustomReturn: MaybeG(Boolean)
          }), StructG({
            method: String,
            url: String,
            headers: DictG(String, String),
            data: MaybeG(Object)
          }))
        }, {
          default: function(params) {
            var data, headerName, headerValue, headers, method, ref, url;
            method = this.methodForRequest(params);
            url = this.urlForRequest(params);
            headers = {};
            ref = this.headersForRequest(params);
            for (headerName in ref) {
              if (!hasProp.call(ref, headerName)) continue;
              headerValue = ref[headerName];
              headers[headerName.toLowerCase()] = headerValue;
            }
            if (headers['accept'] == null) {
              headers['accept'] = '*/*';
            }
            data = this.dataForRequest(params);
            return {method, url, headers, data};
          }
        });

        _Class.public(_Class.async({
          sendRequest: FuncG(StructG({
            method: String,
            url: String,
            options: InterfaceG({
              json: EnumG([true]),
              headers: DictG(String, String),
              body: MaybeG(Object)
            })
          }), StructG({
            body: MaybeG(AnyT),
            headers: DictG(String, String),
            status: Number,
            message: MaybeG(String)
          }))
        }, {
          default: function*({method, url, options}) {
            var body, depModuleName, depModuleVersion, foreignApp, foreignRes, foreignSwitch, headers, message, status, t1, version;
            this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>>>>>>> FOREIGN MAKE OR CREATE', LEVELS[DEBUG]);
            t1 = Date.now();
            ({version} = this.Module.context().manifest.dependencies[this.dependencyName]);
            foreignApp = this.Module.context().dependencies[this.dependencyName];
            depModuleName = foreignApp.Module.name;
            depModuleVersion = foreignApp.Module.context().manifest.version;
            if (!semver.satisfies(depModuleVersion, version)) {
              throw new Error(`Dependent module ${depModuleName} not compatible. This module required version ${version} but ${depModuleName} version is ${depModuleVersion}.`);
            }
            this.sendNotification(SEND_TO_LOG, `>>>>>>>>>>>>>>>>>>>>>>>>> FOREIGN START after ${Date.now() - t1}`, LEVELS[DEBUG]);
            foreignSwitch = foreignApp.facade.retrieveMediator(APPLICATION_SWITCH);
            foreignRes = (yield foreignSwitch.perform(method, url, options));
            this.sendNotification(SEND_TO_LOG, `ArangoForeignCollectionMixin::sendRequest <result> ${JSON.stringify(foreignRes)}`, LEVELS[DEBUG]);
            this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>>>>>>> FOREIGN END', LEVELS[DEBUG]);
            ({status, message, headers, body} = foreignRes);
            return {status, message, headers, body};
          }
        }));

        _Class.public({
          requestToHash: FuncG(StructG({
            method: String,
            url: String,
            headers: DictG(String, String),
            data: MaybeG(Object)
          }), StructG({
            method: String,
            url: String,
            options: InterfaceG({
              json: EnumG([true]),
              headers: DictG(String, String),
              body: MaybeG(Object)
            })
          }))
        }, {
          default: function({method, url, headers, data}) {
            var options;
            options = {
              json: true,
              headers
            };
            if (data != null) {
              options.body = data;
            }
            return {method, url, options};
          }
        });

        _Class.public(_Class.async({
          makeRequest: FuncG(StructG({
            method: String,
            url: String,
            headers: DictG(String, String),
            data: MaybeG(Object)
          }), StructG({
            body: MaybeG(AnyT),
            headers: DictG(String, String),
            status: Number,
            message: MaybeG(String)
          }))
        }, {
          default: function*(request) { // result of requestFor
            var hash;
            hash = this.requestToHash(request);
            this.sendNotification(SEND_TO_LOG, `ArangoForeignCollectionMixin::makeRequest <hash> ${JSON.stringify(hash)}`, LEVELS[DEBUG]);
            return (yield this.sendRequest(hash));
          }
        }));

        _Class.public(_Class.async({
          parseQuery: FuncG([UnionG(Object, QueryInterface)], UnionG(Object, String, QueryInterface))
        }, {
          default: function*(aoQuery) {
            var params;
            params = {};
            switch (false) {
              case aoQuery.$remove == null:
                if (aoQuery.$forIn != null) {
                  params.requestType = 'removeBy';
                  params.recordName = this.delegate.name;
                  params.query = aoQuery;
                  params.isCustomReturn = true;
                  return params;
                }
                break;
              case aoQuery.$patch == null:
                if (aoQuery.$forIn != null) {
                  params.requestType = 'patchBy';
                  params.recordName = this.delegate.name;
                  params.query = aoQuery;
                  params.isCustomReturn = true;
                  return params;
                }
                break;
              default:
                params.requestType = 'query';
                params.recordName = this.delegate.name;
                params.query = aoQuery;
                params.isCustomReturn = (aoQuery.$collect != null) || (aoQuery.$count != null) || (aoQuery.$sum != null) || (aoQuery.$min != null) || (aoQuery.$max != null) || (aoQuery.$avg != null) || (aoQuery.$remove != null) || aoQuery.$return !== '@doc';
                return params;
            }
          }
        }));

        _Class.public(_Class.async({
          executeQuery: FuncG([UnionG(Object, String, QueryInterface)], CursorInterface)
        }, {
          default: function*(aoQuery, options) {
            var body, request, res;
            request = this.requestFor(aoQuery);
            res = (yield this.makeRequest(request));
            if (res.status >= 400) {
              throw new Error(`Request failed with status ${res.status} ${res.message}`);
            }
            ({body} = res);
            if ((body != null) && body !== '') {
              if (_.isString(body)) {
                body = JSON.parse(body);
              }
              if (!_.isArray(body)) {
                body = [body];
              }
              if (aoQuery.isCustomReturn) {
                return Cursor.new(null, body);
              } else {
                return Cursor.new(this, body);
              }
            } else {
              return Cursor.new(null, []);
            }
          }
        }));

        _Class.initializeMixin();

        return _Class;

      }).call(this);
    }));
  };

}).call(this);
