const { registerCoreHelpers } = require('./helpers')

function asyncHelpers(handlebars) {

  const _compile = handlebars.compile,
    _template = handlebars.VM.template

  handlebars.JavaScriptCompiler = class extends handlebars.JavaScriptCompiler {

    mergeSource(varDeclarations) {
      const sources = super.mergeSource(varDeclarations)
      return sources.prepend('return (async () => {').add(' })()')
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

  handlebars.template = function(spec) {
    spec.main_d = (prog, props, container, depth, data, blockParams, depths) => async(context) => {
      // const main = await spec.main
      return spec.main(container, context, container.helpers, container.partials, data, blockParams, depths)
      return v
    }
    return _template(spec, handlebars)
  }

  handlebars.compile = function(template, options) {
    const compiled = _compile.apply(handlebars, [template, { ...options, noEscape: true }])

    return function(context, execOptions) {
      context = context || {}

      return compiled.call(handlebars, context, execOptions)
    }
  }

  registerCoreHelpers(handlebars)

  return handlebars
}

module.exports = asyncHelpers