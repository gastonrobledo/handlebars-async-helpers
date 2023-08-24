const {
    appendContextPath, createFrame, blockParams, isPromise
  } = require('../utils'),
  { Readable } = require('stream')

module.exports = (handlebars) => {
  handlebars.registerHelper('each', async function(context, options) {
    if (!options) {
      throw new Error('Must pass iterator to #each')
    }

    let { fn } = options,
      { inverse } = options,
      i = 0,
      ret = [],
      data,
      contextPath

    if (options.data && options.ids) {
      contextPath = `${appendContextPath(options.data.contextPath, options.ids[0])}.`
    }

    if (typeof context === 'function') {
      context = context.call(this)
    }

    if (options.data) {
      data = createFrame(options.data)
    }

    async function execIteration(field, index, last) {
      if (data) {
        data.key = field
        data.index = index
        data.first = index === 0
        data.last = !!last

        if (contextPath) {
          data.contextPath = contextPath + field
        }
      }

      ret.push(await fn(context[field], {
        data,
        blockParams: blockParams(
          [context[field], field],
          [contextPath + field, null]
        )
      }))
    }

    if (context && typeof context === 'object') {
      if (isPromise(context)) {
        context = await context
      }
      if (Array.isArray(context)) {
        for (let j = context.length; i < j; i++) {
          if (i in context) {
            await execIteration(i, i, i === context.length - 1)
          }
        }
      } else if (global.Symbol && context[global.Symbol.iterator]) {
        const newContext = [],
          iterator = context[global.Symbol.iterator]()
        for (let it = iterator.next(); !it.done; it = iterator.next()) {
          newContext.push(it.value)
        }
        context = newContext
        for (let j = context.length; i < j; i++) {
          await execIteration(i, i, i === context.length - 1)
        }
      } else if (context instanceof Readable) {
        const newContext = []
        await new Promise((resolve, reject) => {
          context.on('data', (item) => {
            newContext.push(item)
          }).on('end', async() => {
            context = newContext
            for (let j = context.length; i < j; i++) {
              await execIteration(i, i, i === context.length - 1)
            }
            resolve()
          }).once('error', e => reject(e))
        })
      } else {
        let priorKey

        for (const key of Object.keys(context)) {
          // We're running the iterations one step out of sync so we can detect
          // the last iteration without have to scan the object twice and create
          // an itermediate keys array.
          if (priorKey !== undefined) {
            await execIteration(priorKey, i - 1)
          }
          priorKey = key
          i++
        }
        if (priorKey !== undefined) {
          await execIteration(priorKey, i - 1, true)
        }
      }
    }

    if (i === 0) {
      return inverse(this);
    } else {
      return ret.join('');
    }
  })
}
