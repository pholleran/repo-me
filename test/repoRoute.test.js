const httpMocks = require('node-mocks-http')
const { Application } = require('probot')
const repoRoute = require('../routes/repoRoute')
const repoMeMock = require('../app.js')

describe('testing the repo route', async () => {
  let app, github

  beforeEach(() => {
    app = new Application()
    app.load(repoMeMock)
    github = {
      apps: {
        createInstallationToken: jest.fn().mockReturnValue(Promise.resolve({
          data: {
            foo: 'bar'
          }
        })),
        findOrgInstallation: jest.fn().mockReturnValue(Promise.resolve({
          data: {
            id: 1
          }
        }))
      },
      repos: {
        createForOrg: jest.fn().mockReturnValue(Promise.resolve({
          data: {
            foo: 'bar'
          }
        })),
        getContent: jest.fn().mockReturnValue(Promise.resolve({
          data: {
            name: 'repo-me.yml',
            path: '.github/repo-me.yml',
            type: 'file',
            content: 'IyB0ZW1wbGF0ZXMKdGVtcGxhdGVfcmVwb3M6CiAgLSBmb28tYmFyCg==\n',
            encoding: 'base64'
          },
          status: 200
        }))
      }
    }
    app.auth = () => Promise.resolve(github)
  })

  test('calling repoRoute with a proper RPC request calls createRepo()', async () => {
    let req = httpMocks.createRequest({
      method: 'POST',
      url: 'http://localhost:3000/',
      headers: {
        'Chatops-Nonce': 'HKfcBNOxsj4NGlY+xZGizu/DV12yha4P5OjqSmvFFDQ=',
        'Chatops-Timestamp': '2018-10-22T03:47:50.599Z',
        'Chatops-Signature': 'Signature keyid=hubotkey,signature=LdAPLsyrdJPCByJphnvZRHesAmy/HdfERsiU/FW5pa9nWChcZofKzXr+z8NDGWyYYeiFMC9ojSZ5ITBZx8sqyQ0tjhCeemlg5ZsjXOEsZ6Mo3Ua32tkERTn72lvymiWOGMgtftPGKGMGHI+jMnDQY1yDIkuQacacWwYjAa7CxYfrx/8YDkOhlAoNUWOmHvc3YvYfrph9x38GjCFv7rFfrBEn4cBz3nS0+eMfgDubWele3q09OOJfGQp8MFfiHXM6YTMTuH8uqbZTGcTKW2SXeaMQJN1gQF03JbkS7nT7UPA3WmwJswzzxtCiLD39cGIIxmiKrsWOPH6q9mZvFCXFkw=='
      },
      hostname: 'localhost',
      originalUrl: '/repo-me',
      protocol: 'http',
      body: {
        params: {
          org: 'pholleran-org',
          repoName: 'test-repo',
          template: 'foo-bar'
        }
      }
    })
    expect.assertions(1)
    let res = httpMocks.createResponse()
    await repoRoute(req, res, app)
    expect(github.repos.createForOrg).toHaveBeenCalled()
  })
})
