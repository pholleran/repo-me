module.exports = app => {
  const bodyParser = require('body-parser')
  var jsonParser = bodyParser.json()
  const createRepoFromIssue = require('./lib/createRepoFromIssue')
  const rpcListing = require('./lib/rpcListing')
  const repoRoute = require('./lib/repoRoute')

  const router = app.route('/repo-me')
  router.use(require('express').static('public'))
  router.use(jsonParser)

  // chatops rpc endpoint for listing
  router.get('/', rpcListing)

  // chatops rpc endpoint for new repo
  router.post('/repo', async (req, res) => {
    repoRoute(req, res, app)
  })

  // behavior for issue-driven workflow
  app.on(['issues.opened', 'issues.edited'], async context => {
    createRepoFromIssue(context, app)
  })
}
