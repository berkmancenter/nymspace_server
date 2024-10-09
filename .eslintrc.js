module.exports = {
  env: {
    node: true,
    jest: true
  },
  extends: [
    'standard',
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:security/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: ['jest', 'security', 'prettier'],
  rules: {
    'no-console': 'error',
    'func-names': 'off',
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'jest/expect-expect': 'off',
    'security/detect-object-injection': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': ['off', 'ForOfStatement']
  }
}
