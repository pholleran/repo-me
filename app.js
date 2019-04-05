module.exports = app => {
  const bodyParser = require('body-parser')
  var jsonParser = bodyParser.json()
  const createRepoFromIssue = require('./lib/createRepoFromIssue')
  const rpcListingRoute = require('./routes/rpcListingRoute')
  const repoRoute = require('./routes/repoRoute')

  const router = app.route('/repo-me')
  router.use(require('express').static('public'))
  router.use(jsonParser)

  // chatops rpc endpoint for listing
  router.get('/', rpcListingRoute)

  // Add a new route
  router.get('/hello-world', (req, res) => {
    res.send('Hello World')
  })

  // chatops rpc endpoint for new repo
  router.post('/repo', async (req, res) => {
    repoRoute(req, res, app)
  })

  // behavior for issue-driven workflow
  app.on(['issues.opened', 'issues.edited'], async context => {
    createRepoFromIssue(context, app)
  })
}
