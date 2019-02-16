const rpc = require('../lib/rpc')
const repoMe = require('../lib/repoMe')

module.exports = async (req, res, app) => {
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
}
