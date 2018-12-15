// rpc.js
const rpc = require('../lib/rpc')
const httpMocks = require('node-mocks-http')

describe('RPC signature validation tests', () =>

  beforeEach(
    process.env.RPC_PUBLIC_KEY = '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAqMjlXtB/eJ/VozFSGAyIq7ArVLoUIRv0/C3PdwsJQEaTQJhrMvHv\n8fIr8KCz5gscnykQNXMCJXPCmQxgFzTrUYvqKK7MKtP+oH2xEuYc+q4hm1cffiSK\nOCm1neel0JcjHWb8zgL4CpryarqSHV+j2jB91hX2LXiy4mMnyZk4/v1mEUrUSeL9\nSE4oNMwwQZbZ9RP5LFm6wgzvGPCwUjlHic+/4yYBQRxMDM5JJLsmB65Vd0xQf7PP\n6xWkFrjOW/wjOsxGj8vM5BUfFUNFNjyHgcHnnlS2AYTmuoLaIu0N6P4yUtCKJlhH\nzQ/Ub+GIaVcP8uwPnTgXZ3lJP7nQbI5WgQIDAQAB\n-----END RSA PUBLIC KEY-----\n'
  ),

test('it validates the signature', () => {
  console.log(process.env['RPC_PUBLIC_KEY'])
  let req = httpMocks.createRequest({
    method: 'GET',
    url: 'http://localhost:3000/',
    headers: {
      'Chatops-Nonce': 'HKfcBNOxsj4NGlY+xZGizu/DV12yha4P5OjqSmvFFDQ=',
      'Chatops-Timestamp': '2018-10-22T03:47:50.599Z',
      'Chatops-Signature': 'Signature keyid=hubotkey,signature=LdAPLsyrdJPCByJphnvZRHesAmy/HdfERsiU/FW5pa9nWChcZofKzXr+z8NDGWyYYeiFMC9ojSZ5ITBZx8sqyQ0tjhCeemlg5ZsjXOEsZ6Mo3Ua32tkERTn72lvymiWOGMgtftPGKGMGHI+jMnDQY1yDIkuQacacWwYjAa7CxYfrx/8YDkOhlAoNUWOmHvc3YvYfrph9x38GjCFv7rFfrBEn4cBz3nS0+eMfgDubWele3q09OOJfGQp8MFfiHXM6YTMTuH8uqbZTGcTKW2SXeaMQJN1gQF03JbkS7nT7UPA3WmwJswzzxtCiLD39cGIIxmiKrsWOPH6q9mZvFCXFkw=='
    },
    hostname: 'localhost',
    originalUrl: '/repo-me',
    protocol: 'http'
  })
  expect(rpc.validateSignature(req)).toBe(true)
})
)
