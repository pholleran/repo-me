module.exports = app => {

  const fs = require('fs')
  const os = require('os')
  const path = require('path')
  const bodyParser = require('body-parser')
  var jsonParser = bodyParser.json()
  const shell = require('shelljs')
  const yaml = require('js-yaml')

  const NodeRSA = require('node-rsa')
  const keyData = fs.readFileSync('hubot-test.pub', 'utf8')
  const publicKey = new NodeRSA(keyData, 'pkcs1-public-pem')

  const router = app.route('/repo-me')
  router.use(require('express').static('public'))
  
  // chatops rpc listing route
  router.get('/', (req, res) => {
    if (signatureIsValid(req)) {
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
    if (signatureIsValid(req)) {

      let octokit = await app.auth()
      const { data: installation } = await octokit.apps.findOrgInstallation({org: req.body.params.org})  // if this errors out the app is not installed in the org--need to handle
      octokit = await app.auth(installation.id)
  
      // call newRepo with parameters
      let repo = await JSON.stringify(newRepo(req.body.params.org, req.body.params.repoName, req.body.params.template, "rpc", res, octokit))

    } else {
      // return error msg
    }
  })

  // behavior for issue-driven workflow
  app.on(['issues.opened', 'issues.edited', 'issues.commented'], async context => {

    if (context.payload.repository.name == 'create-repository') {

      let params = {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: context.payload.issue.number
      }

      let issue = await context.github.issues.get(params)

      console.log(issue.data.body)

      // parse the body for parameters

      // call newRepo with parameters

    }
  })

  // function to create new repo
  async function newRepo (org, repoName, template, callingMethod, res = false, github) {
    
    let templates = await getTemplates(org, 'create-repository', github)
    if (templates.includes(template)) {

      try {
        // create the new repository (private is NOT default)
        // repo will be empty, but better to have this fail now then wait until after the cloning and parsing
        const newRepo = await github.repos.createForOrg({name: repoName, org: org, private: true})
      }
      catch(error) {
        // handle cannot create repo error
      }

      let tempFolder
      let tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tmp-'), (err, folder) => {
        if (err) throw err;
        tempFolder = folder
      })
      
      // using the instance of octokit passed to this function to geberate ab installation token creates PEM errors
      // need to create and auth a unique one to handle the clone
      let octoclone = await app.auth()
      const { data: installation } = await octoclone.apps.findOrgInstallation({org: org})  // if this errors out the app is not installed in the org--need to handle
      let tokenResp = await octoclone.apps.createInstallationToken({installation_id: installation.id})
      let token = tokenResp.data.token

      // change to the temp folder
      shell.cd(tempFolder)

      // clone the repo
      if (shell.exec('git clone https://x-access-token:' + token + '@github.com/' + org + '/' + template + '.git').code !== 0) {
        shell.echo('Error: Git clone failed');
      }

      // delete the .git folder
      if (shell.exec('rm -rf ' + template + '/' + '.git').code !== 0) {
        shell.echo('Error: git repo not unintialized');
      }

      // rename the repo folder
      if (shell.exec('mv ' + template + ' ' + repoName).code !== 0) {
        shell.echo('Error: git repo not renamed');
      }

      // change names in the new directory
      // will need to recursively look through all files for mentions of template name
      // and change to new name

      // initialize the new repo
      shell.cd(repoName)
      if (shell.exec('git init').code !== 0) {
        shell.echo('Error: new git repo not initialized');
      }

      if (shell.exec('git add *').code !== 0) {
        shell.echo('Error: files not added to staging area');
      }

      if (shell.exec('git commit -m "initial commit"').code !== 0) {
        shell.echo('Error: initial commit failed');
      }

      if (shell.exec('git remote add origin https://x-access-token:' + token + '@github.com/' + org + '/' + repoName + '.git').code !== 0) {
        shell.echo('Error: git remote not added');
      }

      if (shell.exec('git push -u origin master').code !== 0) {
      shell.echo('Error: git not pushed to master');
      }

      shell.rm('-rf', tempFolder)
    } else {
      console.error(error)
    }
    
    // clean up the temp space
  }

  // handle errors and report back to user's input method
  async function reportError(errorText, context = false, res = false) {
    
    // if user sent request via RPC
    if (res) {

    } 
    // otherwise report back through GitHub
    else {

    }
  }

  // get the data from the request to verify
  const dataToVerify = (req) => {

    let verifyUrl = req.protocol + "://" + req.hostname + ":3000" + req.originalUrl + "\\n" + req.get("Chatops-Nonce") + '\\n' + req.get("Chatops-Timestamp") + '\\n'

    // handle a post to the listing endpoint
    if (req.method == 'POST') {
      verifyUrl = verifyUrl + req.body
    }
    return verifyUrl
  }

   // get template config
   const getTemplates = async (org, repo, github) => {
    let templateData
    let templateYaml
    
    // check for yaml file in org/create-repository/.github/repo-me.yml
    try {
      templateData = await github.repos.getContent({owner: org, repo: repo, path: '.github/repo-me.yml'})
    } 
    catch(error) {
      console.error(error)
    }

    let templateBuffer = new Buffer(templateData.data.content, 'base64')

    // load fie and error if improperly formatted
    try {
      templateYaml = yaml.safeLoad(templateBuffer)
      templateYaml = templateYaml.template_repos
    }
    catch(error) {
      console.error("error")
    }

    return templateYaml
  }

  // verify signature
  const signatureIsValid = async (req) => {
    let verifyData = dataToVerify(req)    

    // get the signature
    let signatureHeader = req.get('Chatops-Signature')
    let sigIndex = signatureHeader.indexOf('signature')
    let signature = signatureHeader.substring(sigIndex + 10)

    console.log(publicKey.verify(verifyData, signature, 'utf8', 'base64'));
    return true
  }

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
