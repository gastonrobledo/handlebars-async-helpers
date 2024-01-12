const app = require('./package.json')
const { registerCoreHelpers } = require('./helpers')

const isPromise = (obj) => !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'

function asyncHelpers(hbs) {

  const handlebars = hbs.create(),
        asyncCompiler = class extends hbs.JavaScriptCompiler {

          constructor() {
            super()
            this.compiler = asyncCompiler
          }

          mergeSource(varDeclarations) {
            const sources = super.mergeSource(varDeclarations)
            sources.prepend('return (async () => {')
            sources.add(' })()')
            return sources
          }

          appendToBuffer(source, location, explicit) {
            // Force a source as this simplifies the merge logic.
            if (!Array.isArray(source)) {
              source = [source]
            }
            source = this.source.wrap(source, location)

            if (this.environment.isSimple) {
              return ['return await ', source, ';']
            } if (explicit) {
              // This is a case where the buffer operation occurs as a child of another
              // construct, generally braces. We have to explicitly output these buffer
              // operations to ensure that the emitted code goes in the correct location.
              return ['buffer += await ', source, ';']
            }
            source.appendToBuffer = true
            source.prepend('await ')
            return source

          }

        }
  handlebars.JavaScriptCompiler = asyncCompiler

  const _compile = handlebars.compile,
        _template = handlebars.VM.template,
        _escapeExpression = handlebars.escapeExpression,
        escapeExpression = function(value) {
          if(isPromise(value)) {
            return value.then((v) => _escapeExpression(v))
          }
          return _escapeExpression(value)
        }

  function lookupProperty(containerLookupProperty) {
    return function(parent, propertyName) {
      if (isPromise(parent)) {
        return parent.then((p) => containerLookupProperty(p, propertyName))
      }
      return containerLookupProperty(parent, propertyName)
    }
  }

  handlebars.template = function(spec) {
    spec.main_d = (prog, props, container, depth, data, blockParams, depths) => async(context) => {
      // const main = await spec.main
      container.escapeExpression = escapeExpression
      container.lookupProperty = lookupProperty(container.lookupProperty)
      if(depths.length == 0){
        depths = [data.root]
      }
      const v = spec.main(container, context, container.helpers, container.partials, data, blockParams, depths)
      return v
    }
    return _template(spec, handlebars)
  }

  handlebars.compile = function(template, options) {
    const compiled = _compile.apply(handlebars, [template, { ...options }])

    return function(context, execOptions) {
      context = context || {}
      const result = compiled.call(handlebars, context, execOptions)
      
      if (isPromise(result)) {
        // this are dummy methods to work with handlebar code, it is only designed for usage with that, otherwise it may break!
        result.split = () => { return [] }
        result.join = () => { return result }

        return result

      }
      return result
    }
  }
  handlebars.ASYNC_VERSION = app.version

  registerCoreHelpers(handlebars)

  return handlebars
}

module.exports = asyncHelpers
