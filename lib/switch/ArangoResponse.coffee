# This file is part of leanrc-arango-extension.
#
# leanrc-arango-extension is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# leanrc-arango-extension is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with leanrc-arango-extension.  If not, see <https://www.gnu.org/licenses/>.

typeis              = require('type-is').is
assert              = require 'assert'
getType             = require('mime-types').contentType
Stream              = require 'stream'


module.exports = (Module)->
  {
    AnyT, NilT
    FuncG, UnionG, MaybeG
    ResponseInterface, SwitchInterface, ContextInterface
    CoreObject
    # ResponseInterface
    # SwitchInterface
    # ContextInterface
    Utils: { _, statuses }
  } = Module::

  class ArangoResponse extends CoreObject
    @inheritProtected()
    @implements ResponseInterface
    @module Module

    @public res: Object, # native response object
      get: -> @ctx.res

    @public switch: SwitchInterface,
      get: -> @ctx.switch

    @public ctx: ContextInterface

    @public socket: MaybeG(Object),
      get: ->

    @public header: Object,
      get: -> @headers
    @public headers: Object,
      get: -> @res.headers

    @public status: MaybeG(Number),
      get: -> @res.statusCode
      set: (code)->
        assert _.isNumber(code), 'status code must be a number'
        assert statuses[code], "invalid status code: #{code}"
        @_explicitStatus = yes
        @res.statusCode = code
        @res.statusMessage = statuses[code]
        if Boolean(@body and statuses.empty[code])
          @body = null
        return code

    @public message: String,
      get: -> @res.statusMessage ? statuses[@status]
      set: (msg)->
        @res.statusMessage = msg
        return msg

    @public body: MaybeG(UnionG String, Buffer, Object, Array, Number, Boolean, Stream),
      get: -> @_body
      set: (val)->
        original = @_body
        @_body = val
        unless val?
          unless statuses.empty[@status]
            @status = 204
          @remove 'Content-Type'
          @remove 'Content-Length'
          @remove 'Transfer-Encoding'
          return
        unless @_explicitStatus
          @status = 200
        setType = not @headers['content-type']
        if _.isString val
          if setType
            @type = if /^\s*</.test val then 'html' else 'text'
          return
        if _.isBuffer val
          if setType
            @type = 'bin'
          return
        @remove 'Content-Length'
        @type = 'json'
        return

    @public length: Number,
      get: ->
        len = @headers['content-length']
        unless len?
          return 0 unless @body
          if _.isString @body
            return Buffer.byteLength @body
          if _.isBuffer @body
            return @body.length
          if _.isObjectLike @body
            return Buffer.byteLength JSON.stringify @body
          return 0
        ~~Number len
      set: (n)->
        @set 'Content-Length', n
        return n

    @public headerSent: MaybeG(Boolean),
      get: -> no

    @public vary: FuncG(String),
      default: (args...)->
        @res.vary args...
        return

    @public redirect: FuncG([String, MaybeG String]),
      default: (url, alt)->
        if 'back' is url
          url = @ctx.get('Referrer') or alt or '/'
        if statuses.redirect[@status]
          @res.redirect url
        else
          @res.redirect 302, url
        return

    @public attachment: FuncG(String),
      default: (filename)->
        @res.attachment filename
        return

    @public lastModified: MaybeG(Date),
      get: ->
        date = @get 'last-modified'
        if date
          new Date date
      set: (val)->
        if _.isString val
          val = new Date val
        @set 'Last-Modified', val.toUTCString()
        return val

    @public etag: String,
      get: -> @get 'ETag'
      set: (val)->
        val = "\"#{val}\"" unless /^(W\/)?"/.test val
        @set 'ETag', val
        return val

    # @public type: String,
    #   get: ->
    #     @res.type()
    #   set: (type)->
    #     @res.type type

    @public type: MaybeG(String),
      get: ->
        type = @get 'Content-Type'
        return '' unless type
        type.split(';')[0]
      set: (_type)->
        type = getType _type
        if type
          @set 'Content-Type', type
        else
          @remove 'Content-Type'
        return _type

    @public 'is': FuncG([UnionG String, Array], UnionG String, Boolean, NilT),
      default: (args...)->
        [types] = args
        return @type or no unless types
        unless _.isArray types
          types = args
        typeis @type, types

    @public get: FuncG(String, UnionG String, Array),
      default: (field)->
        @headers[field.toLowerCase()] ? ''

    @public set: FuncG([UnionG(String, Object), MaybeG AnyT]),
      default: (args...)->
        [field, val] = args
        if 2 is args.length
          if _.isArray val
            val = val.map String
          else
            val = String val
          @res.setHeader field, val
        else
          for own key, value of field
            @set key, value
        return

    @public append: FuncG([String, UnionG String, Array]),
      default: (field, val)->
        prev = @get field
        if prev
          if _.isArray prev
            val = prev.concat val
          else
            val = [prev].concat val
        @set field, val

    @public remove: FuncG(String),
      default: (field)->
        @res.removeHeader field
        return

    @public flushHeaders: Function,
      default: (field)->
        Object.keys(@res.headers).forEach (name)=>
          @res.removeHeader name
        return

    @public writable: Boolean,
      get: -> yes

    @public @static @async restoreObject: Function,
      default: ->
        throw new Error "restoreObject method not supported for #{@name}"
        yield return

    @public @static @async replicateObject: Function,
      default: ->
        throw new Error "replicateObject method not supported for #{@name}"
        yield return

    @public init: FuncG(ContextInterface),
      default: (context)->
        @super()
        @ctx = context
        return


    @initialize()
