const { Application } = require('probot')
const repoMeMock = require('../app')

const issuesOpenedPayload = require('./fixtures/issues.opened.json')

describe('testing repo creation from issue', async () => {
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
      issues: {
        get: jest.fn().mockReturnValue(Promise.resolve({
          data: {
            body: '# Some text\r\nname: my-new-repo\r\ntemplate: foo-bar\r\nsome other text'
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

  test('creates a new repository when passed correct information', async () => {
    await app.receive({
      name: 'issues.opened',
      payload: issuesOpenedPayload
    })
    expect(github.repos.createForOrg).toHaveBeenCalled()
  })
})
