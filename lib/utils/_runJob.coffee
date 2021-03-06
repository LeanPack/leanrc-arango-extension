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

Queues = require '@arangodb/foxx/queues'
{ db } = require '@arangodb'


module.exports = (FoxxMC)->
  FoxxMC::Utils.runJob = (cfg) ->
    do (
      {
        command = ->
        failure = ->
        context = module.context
        retryOnFailure = no
      } = cfg
    ) ->
      [ params = {}, jobId ] = context.argv ? []
      unless jobId?
        console.log 'Run as not a job!'
        return command? params
      {queue:queueName} = db._jobs.document jobId
      queue = Queues.get queueName
      job = queue.get jobId
      try
        command? params, jobId
      catch e
        job.abort()
        try failure? e, params, job catch err then console.error 'Failure', err
        if retryOnFailure
          opts = {}
          {
            maxFailures : opts.maxFailures
            repeatDelay : opts.repeatDelay
            repeatTimes : opts.repeatTimes
            repeatUntil : opts.repeatUntil
            failure     : opts.failure
            success     : opts.success
            backOff     : opts.backOff
          } = db._jobs.document jobId
          for own key, value of opts
            delete opts[key]  unless value?
          maxFailures = job.type.maxFailures ? opts.maxFailures ? 0
          if maxFailures > 1 or maxFailures < 0 or maxFailures is Infinity
            opts.maxFailures = maxFailures
            unless maxFailures < 0 or maxFailures is Infinity
              --opts.maxFailures
            backOff = job.type.backOff ? opts.backOff ? 2000
            delay = if Math.random() < 0.5 then backOff / 2 else backOff
            opts.delayUntil = Date.now() + delay
            script = Object.assign {}, job.type
            data = Object.assign {}, params
            queue.push script, data, opts
        throw e
      return
