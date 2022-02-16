const { registerCoreHelpers } = require('./helpers')

function asyncHelpers(handlebars) {
  const _compile = handlebars.compile,
        _template = handlebars.VM.template,
        _mergeSource = handlebars.JavaScriptCompiler.prototype.mergeSource

  handlebars.JavaScriptCompiler.prototype.mergeSource = function(varDeclarations) {
    const sources = _mergeSource.call(this, varDeclarations)
    return sources.prepend('return (async () => {').add(' })()')
  }

  handlebars.JavaScriptCompiler.prototype.appendToBuffer = function(source, location, explicit) {
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

  handlebars.template = function(spec) {
    spec.main_d = (prog, props, container, depth, data, blockParams, depths) => async(context) => {
      // const main = await spec.main
      const v = spec.main(container, context, container.helpers, container.partials, data, blockParams, depths)
      return v
    }
    return _template(spec, handlebars)
  }

  handlebars.compile = function() {
    const compiled = _compile.apply(handlebars, [...arguments, { noEscape: true }])

    return function(context, execOptions) {
      context = context || {}

      return compiled.call(handlebars, context, execOptions)
    }
  }

  registerCoreHelpers(handlebars)

  return handlebars
}

module.exports = asyncHelpers
