const httpMocks = require('node-mocks-http')

test('that we can run tests', () => {
  // your real tests go here
  expect(1 + 2 + 3).toBe(6)
})

describe('testing the repo route', () =>
  test('a proper RPC request calls newRepo()', () => {
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
  })
)