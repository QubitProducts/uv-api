module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'expect', 'sinon'],
    files: [
      'uv-api.js',
      'test/test-uv-api.js'
    ],
    reporters: ['spec'],
    logLevel: config.LOG_INFO,
    browsers: ['Firefox']
  })
}
