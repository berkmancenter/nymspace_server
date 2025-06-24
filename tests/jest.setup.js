const { ReadableStream } = require('node:stream/web')
// Jest seems to require this shim for any tests dealing with agents
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
require('openai/shims/node')

// ReadableStream also used by langchain, needs to be added to jest environment
global.ReadableStream = ReadableStream
