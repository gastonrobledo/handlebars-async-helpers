module.exports = {
  extends: [
    'eslint-config-airbnb-base',
    'eslint-config-airbnb-base/rules/strict'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  globals: {
    beforeEach: true,
    afterEach: true,
    describe: true,
    expect: true,
    it: true,
    xdescribe: true,
    xit: true
  },
  rules: {
    camelcase: 'error',
    'comma-dangle': 0,
    'class-methods-use-this': 0,
    'no-use-before-define': ['error', { functions: false }],
    indent: ['warn', 2, { VariableDeclarator: { var: 2, let: 2, const: 3 }, SwitchCase: 1 }],
    'keyword-spacing': 'warn',
    'new-cap': ['warn', { properties: false }],
    'no-control-regex': 0,
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-param-reassign': 'off',
    'one-var': ['warn', 'always'],
    'padded-blocks': ['warn', { classes: 'always' }],
    semi: ['error', 'never'],
    'space-before-function-paren': ['error', 'never']
  }
}
