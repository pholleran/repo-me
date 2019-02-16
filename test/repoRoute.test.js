const httpMocks = require('node-mocks-http')
const { Application } = require('probot')
const repoRoute = require('../routes/repoRoute')
const repoMeMock = require('../app.js')

describe('testing the repo route', async () => {
  let app, github

  beforeEach(() => {
    process.env.RPC_PUBLIC_KEY = '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAqMjlXtB/eJ/VozFSGAyIq7ArVLoUIRv0/C3PdwsJQEaTQJhrMvHv\n8fIr8KCz5gscnykQNXMCJXPCmQxgFzTrUYvqKK7MKtP+oH2xEuYc+q4hm1cffiSK\nOCm1neel0JcjHWb8zgL4CpryarqSHV+j2jB91hX2LXiy4mMnyZk4/v1mEUrUSeL9\nSE4oNMwwQZbZ9RP5LFm6wgzvGPCwUjlHic+/4yYBQRxMDM5JJLsmB65Vd0xQf7PP\n6xWkFrjOW/wjOsxGj8vM5BUfFUNFNjyHgcHnnlS2AYTmuoLaIu0N6P4yUtCKJlhH\nzQ/Ub+GIaVcP8uwPnTgXZ3lJP7nQbI5WgQIDAQAB\n-----END RSA PUBLIC KEY-----\n'
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
        'Chatops-Nonce': '+KwsvHQ0+VPGBtKm8Pjcv+CJoAU+iqxfSmXF59zkK44=',
        'Chatops-Timestamp': '2018-11-17T05:20:38.308Z',
        'Chatops-Signature': 'Signature keyid=hubotkey,signature=fxj19A34Qec2yoKgBliELY7u9+Wru1T60JdVsa6gRCTAnHuiUjqVpkesVOq6jch//BRPzG97GOjzzf0Y7J49s55LHnLEZViaioX1taW07PFiZq7HxETld4b43UH7K262LZemYj+ZLm6eSE2eP7j+1fGIMJqm1T0H/p7ixV3FB5Rpd769I3wT5F2+oaYK/XOTUEGHyPIN0mwIWJYKoH/c/m1VHCr07z/PYXc6L8ArAI9Ttd6BYbsqBzxaUjWat3qJA/KxleUf20yAUhkrQAoZlVrINeAhy/rOAxtgo3N3jt9vdPpByI19Ft+QD9K62WDDPewOc4xFph5Y6T8fyXad9A=='
      },
      hostname: 'localhost',
      originalUrl: '/repo-me/repo',
      protocol: 'http',
      body: {
        'user': 'Shell',
        'mention_slug': '1',
        'params': {
          'org': 'pholleran-org',
          'repoName': 'test-repo',
          'template': 'foo-bar'
        },
        'room_id': '#Shell',
        'method': 'create'
      }
    })
    expect.assertions(1)
    let res = httpMocks.createResponse()
    await repoRoute(req, res, app)
    expect(github.repos.createForOrg).toHaveBeenCalled()
  })
})
