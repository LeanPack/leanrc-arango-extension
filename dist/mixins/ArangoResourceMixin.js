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

  // TODO: этот миксин должен переопределить execute метод ресурса так, чтобы до выполнения открылась транзакция, после получения результата, транзакция должна быть закрыта.
  // TODO: потом надо от Resque получить сохраненные в темпе джобы, отрыть новую транзакцию на _queues и _jobs - и сохранить джобы, после чего закрыть транзакцию и послать результат медиатору который его запросил
  // TODO: в контексте надо зарезервировать transactionId, чтобы когда понадобтся - им можно было воспользоваться.
  var ARANGO_CONFLICT, ARANGO_NOT_FOUND, db, errors, queues,
    indexOf = [].indexOf;

  ({db, errors} = require('@arangodb'));

  queues = require('@arangodb/foxx/queues');

  ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;

  ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;

  module.exports = function(Module) {
    var AnyT, ContextInterface, DEBUG, ERROR, FuncG, HTTP_CONFLICT, HTTP_NOT_FOUND, LEVELS, ListG, MaybeG, Mixin, Resource, SEND_TO_LOG, StructG, _, assign, inflect, statuses;
    ({
      AnyT,
      FuncG,
      StructG,
      ListG,
      MaybeG,
      ContextInterface,
      Resource,
      Mixin,
      LogMessage: {ERROR, DEBUG, LEVELS, SEND_TO_LOG},
      Utils: {_, inflect, assign, statuses}
    } = Module.prototype);
    HTTP_NOT_FOUND = statuses('not found');
    HTTP_CONFLICT = statuses('conflict');
    return Module.defineMixin(Mixin('ArangoResourceMixin', function(BaseClass = Resource) {
      return (function() {
        var _Class;

        _Class = class extends BaseClass {};

        _Class.inheritProtected();

        _Class.public({
          getLocks: FuncG([], StructG({
            read: ListG(String),
            write: ListG(String)
          }))
        }, {
          default: function() {
            var read, vlCollectionNames, vrCollectionPrefix, write;
            vrCollectionPrefix = new RegExp(`^${inflect.underscore(this.Module.name)}_`);
            vlCollectionNames = db._collections().reduce(function(alResults, aoCollection) {
              var name;
              if (vrCollectionPrefix.test(name = aoCollection.name())) {
                if (!/migrations$/.test(name)) {
                  alResults.push(name);
                }
              }
              return alResults;
            }, []);
            write = vlCollectionNames.concat(['_jobs']);
            read = vlCollectionNames.concat([`${inflect.underscore(this.Module.name)}_migrations`, '_aqlfunctions', '_queues', '_jobs']);
            return {read, write};
          }
        });

        _Class.public({
          listNonTransactionables: FuncG([], ListG(String))
        }, {
          default: function() {
            return ['list', 'detail'];
          }
        });

        _Class.public({
          nonPerformExecution: FuncG(ContextInterface, Boolean)
        }, {
          default: function(context) {
            return !context.isPerformExecution;
          }
        });

        _Class.public(_Class.async({
          doAction: FuncG([String, ContextInterface], MaybeG(AnyT))
        }, {
          default: function*(action, context) {
            var err, error, isTransactionables, locksMethodName, read, ref, ref1, res, voError, voResult, write, writeTransaction;
            isTransactionables = indexOf.call(this.listNonTransactionables(), action) < 0;
            locksMethodName = `locksFor${inflect.camelize(action)}`;
            ({read, write} = assign({}, this.getLocks(), (ref = typeof this.locksForAny === "function" ? this.locksForAny() : void 0) != null ? ref : {}, (ref1 = typeof this[locksMethodName] === "function" ? this[locksMethodName]() : void 0) != null ? ref1 : {}));
            writeTransaction = (yield this.writeTransaction(action, context));
            if (!this.nonPerformExecution(context)) {
              this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>> PERFORM-EXECUTION OPEN', LEVELS[DEBUG]);
              voResult = (yield this.super(action, context));
              this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>> PERFORM-EXECUTION CLOSE', LEVELS[DEBUG]);
              queues._updateQueueDelay();
              return voResult;
            }
            voResult = null;
            voError = null;
            try {
              if (isTransactionables) {
                this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>> TRANSACTION OPEN', LEVELS[DEBUG]);
                voResult = db._executeTransaction({
                  waitForSync: true,
                  collections: {
                    read: read,
                    write: write,
                    allowImplicit: false
                  },
                  action: this.wrap(function(params) {
                    var error, res;
                    res = null;
                    error = null;
                    this.super(params.action, params.context).then(function(data) {
                      return res = data;
                    }).catch(function(err) {
                      voError = err;
                      return error = err;
                    });
                    if (error != null) {
                      throw error;
                    } else {
                      return res;
                    }
                  }),
                  params: {action, context}
                });
                this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>> TRANSACTION CLOSE', LEVELS[DEBUG]);
              } else {
                this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>> NON-TRANSACTION OPEN', LEVELS[DEBUG]);
                res = null;
                error = null;
                this.super(action, context).then(function(data) {
                  return res = data;
                }).catch(function(err) {
                  voError = err;
                  return error = err;
                });
                if (error != null) {
                  throw error;
                } else {
                  voResult = res;
                }
                this.sendNotification(SEND_TO_LOG, '>>>>>>>>>>>>>>>>>>>> NON-TRANSACTION CLOSE', LEVELS[DEBUG]);
              }
            } catch (error1) {
              err = error1;
              if (voError == null) {
                voError = err;
              }
            }
            if (voError != null) {
              if (voError.isArangoError && voError.errorNum === ARANGO_NOT_FOUND) {
                context.throw(HTTP_NOT_FOUND, voError.message, voError.stack);
                return;
              }
              if (voError.isArangoError && voError.errorNum === ARANGO_CONFLICT) {
                context.throw(HTTP_CONFLICT, voError.message, voError.stack);
                return;
              } else if (voError.statusCode != null) {
                context.throw(voError.statusCode, voError.message, voError.stack);
              } else {
                context.throw(500, voError.message, voError.stack);
                return;
              }
            }
            queues._updateQueueDelay();
            return voResult;
          }
        }));

        _Class.initializeMixin();

        return _Class;

      }).call(this);
    }));
  };

}).call(this);