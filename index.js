module.exports = app => {
  const bodyParser = require('body-parser')
  var jsonParser = bodyParser.json()
  const rpcListing = require('./lib/rpcListing')
  const rpc = require('./lib/rpc')
  const repoMe = require('./lib/repoMe')

  const router = app.route('/repo-me')
  router.use(require('express').static('public'))
  router.use(jsonParser)

  router.get('/', rpcListing)

  // chatops rpc endpoint for new repo
  router.post('/repo', async (req, res) => {
    let job = {
      org: req.body.params.org,
      repoName: req.body.params.repoName,
      template: req.body.params.template,
      configRepo: 'create-repository',
      callingMethod: 'rpc',
      res: res
    }
    if (rpc.validateSignature(req) === true) {
      let octokit = await app.auth()
      const { data: installation } = await octokit.apps.findOrgInstallation({ org: req.body.params.org })
      job.github = await app.auth(installation.id)

      // call newRepo with parameters
      let repo = await repoMe.newRepo(job, app)
      if (typeof repo !== 'undefined' && repo.url) {
        res.setHeader('Content-Type', 'application/json')
        res.send({ result: 'Your new repository is available here: ' + repo.html_url })
      }
    } else {
      // return error msg
      let e = {
        message: 'RPC signature could not be validated'
      }
      repoMe.reportError(e, job)
    }
  })

  // behavior for issue-driven workflow
  app.on(['issues.opened', 'issues.edited'], async context => {
    if (context.payload.repository.name === 'create-repository') {
      let params = {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: context.payload.issue.number
      }
      let issue = await context.github.issues.get(params)
      let nameReg = /((?<=name: )([A-Za-z0-9\-_]+))/
      let templateReg = /((?<=template: )([A-Za-z0-9\-_]+))/
      let issueBody = issue.data.body
      let repoName = issueBody.match(nameReg)[0]
      let template = issueBody.match(templateReg)[0]
      let job = {
        org: context.payload.organization.login,
        repoName: repoName,
        template: template,
        configRepo: 'create-repository',
        callingMethod: 'issue',
        context: context,
        github: context.github
      }
      let repo = await repoMe.newRepo(job, app)
      if (typeof repo !== 'undefined' && repo.url) {
        repoMe.commentOnIssue(context, 'Your new repository is available here: ' + repo.html_url, true)
      }
    }
  })
}
