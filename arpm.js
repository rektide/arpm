#!/usr/bin/env node
/**
 * @module arpm
 * @name async requests per minute
 * A generator that yields at a certain requests per minute rate.
 */

// Main exports
module.exports = arpm
module.exports.arpm = arpm
module.exports.default = arpm

// Singleton defaults that get pulled-from/copied-in during initialization if not configured.
module.exports.defaults = {
  interval: 1000.0, // tick rate to generate at
  base: 60000.0 // "per minute"
}
// A simple example that counts at 78/minute.
module.exports.main = main

/**
 * Produce an arpm async generator for a given request/minute rate.
 * @param {number} requestsPerMinute - number of credits to generate in a minute
 * @param {ms} [opts.interval = 1000] - timebase in which to add credits (default
 * @param {ms} [opts.base = 60000] - time constant
 */
function arpm (requestsPerMinute, opts) {
  var interval = opts && opts.interval || module.exports.defaults.interval
  var base = opts && opts.base || module.exports.defaults.base
  var paused = opts && opts.paused || false

  /**
   * async-generator loop that either eats one credit,
   * or returns a promise that resolves with the first available credit.
   * @function arpm
   * @name arpm
   */
  function*arpm () {
    while (true) {
      if (arpm.credit >= 1) {
        --arpm.credit
        yield
      } else {
        if (arpm.waiting) {
          arpm.waiting.reject(new Error('concurrent pulls from arpm'))
        }
        arpm.waiting = Promise.defer()
        yield arpm.waiting.promise
      }
    }
  }

  /**
  * @property {int} credit - accumulated credit ready for taking
  */
  arpm.credit = 0

  /**
  * @property {number} rate - rate of credit production/tick
  * @memberof arpm
  * (Requests/m) / (min/ms) * (tick interval interval)
  */
  arpm.rate = requestsPerMinute / base * interval

  /**
  * @property {defer} waiting - an ask for when no credit available
  */
  arpm.waiting = null

  /**
  * Add new credit, signal for anyone waiting.
  */
  arpm.tick = function tick () {
    arpm.credit += arpm.rate
    if (arpm.waiting && arpm.credit >= 1) {
      arpm.waiting.resolve()
      arpm.waiting = null
      --arpm.credit
    }
  }

  var producer

  /**
  * @function play
  * @memberof arpm
  * Produce credits at rate/interval.
  */
  arpm.play = function () {
    if (!producer) {
      producer = setInterval(arpm.tick, interval)
      return true
    }
    return false
  }
  /**
  * @function pause
  * @memberof arpm
  * Stop producing credit.
  */
  arpm.pause = function () {
    if (producer) {
      clearInterval(producer)
      return true
    }
    return false
  }

  if (!paused) {
    // Begin by default in a producing mode
    arpm.play()
    // With credit available
    arpm.tick()
  }

  return arpm
}

function main (rate) {
  var generate = require('most').generate
  rate = rate || Number.parseInt(process.argv[2]) || 78
  var count = 0
  generate(arpm(rate)).observe(function () {
    console.log(count++)
  })
}
if (require.main === module) {
  main()
}
