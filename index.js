module.exports = app => {

  const bodyParser = require('body-parser')
  var jsonParser = bodyParser.json()
  const rpc = require('./lib/rpc') 
  const repoMe = require('./lib/repoMe') 

  const router = app.route('/repo-me')
  router.use(require('express').static('public'))
  
  // chatops rpc listing route
  router.get('/', async (req, res) => {
    if (await rpc.validateSignature(req) == true) {
      res.setHeader('Content-Type', 'application/json');
      res.send(listing)
      return listing
    } else {
      res.send("signature not valid")
    }
  })

  // chatops rpc endpoint for new repo
  router.post('/repo', jsonParser, async (req, res) => {
    // implement signature verification
    if (rpc.validateSignature(req) == true) {
      let octokit = await app.auth()
      const { data: installation } = await octokit.apps.findOrgInstallation({org: req.body.params.org})  // if this errors out the app is not installed in the org--need to handle
      octokit = await app.auth(installation.id)
      let job = {
        org: req.body.params.org,
        repoName: req.body.params.repoName,
        template: req.body.params.template,
        configRepo: "create-repository",
        callingMethod: "rpc",
        res: res,
        github: octokit
      }
  
      // call newRepo with parameters
      let repo = await repoMe.newRepo(job, app);
      if (repo.html_url) {
        res.setHeader('Content-Type', 'application/json');
        res.send({result: 'Your new repository is available here: ' + repo.html_url})
      }

    } else {
      // return error msg
    }
  })

  // behavior for issue-driven workflow
  app.on(['issues.opened', 'issues.edited'], async context => {
    
    if (context.payload.repository.name == 'create-repository') {
      let params = {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: context.payload.issue.number
      }
      let issue = await context.github.issues.get(params)
      // parse the body for parameters
      let nameReg = /((?<=name: )([A-Za-z0-9\-\_]+))/
      let templateReg = /((?<=template: )([A-Za-z0-9\-\_]+))/
      let issueBody = issue.data.body
      let repoName = issueBody.match(nameReg)[0]
      let template = issueBody.match(templateReg)[0]
      let job = {
        org: context.payload.organization.login,
        repoName: repoName,
        template: template,
        configRepo: "create-repository",
        callingMethod: "issue",
        context: context,
        github: context.github
      }
      let repo = await repoMe.newRepo(job);
      if (repo.html_url) {
        repoMe.commentOnIssue(context, repo)
      }
    }
  })

  // the JSON structure returned by `/_chatops`
  const listing = JSON.stringify({
    namespace: "repo",
    version: 2,
    error_response: "More information is perhaps available [in haystack](https://example.com)",
    methods: {
      create: {
        help: "create <more help soon>",
        regex: "(?:create)(?: (?<org>\\S+) (?<repoName>\\S+) (?<template>\\S+))?",
        params: [
          "org", "repoName", "template"
        ],
        path: "repo"
      }
    }
   })
}