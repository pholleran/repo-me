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
      await newRepo(job)

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
  // async function newRepo (org, repoName, template, callingMethod, res = false, github) {
  async function newRepo (job) {
    
    job.templates = await getTemplates(job)
    if (job.templates.includes(job.template)) {

      try {
        // create the new repository (private is NOT default)
        // repo will be empty, but better to have this fail now then wait until after the cloning and parsing
        await job.github.repos.createForOrg({name: job.repoName, org: job.org, private: true})
      }
      catch (e) {
        reportError(e, job)
      }

      let tempFolder
      await fs.mkdtemp(path.join(os.tmpdir(), 'tmp-'), (err, folder) => {
        if (err) throw err;
        tempFolder = folder
      })
      
      // using the instance of octokit passed to this function to geberate ab installation token creates PEM errors
      // need to create and auth a unique one to handle the clone
      let octoclone = await app.auth()
      const { data: installation } = await octoclone.apps.findOrgInstallation({org: job.org})  // if this errors out the app is not installed in the org--need to handle
      let tokenResp = await octoclone.apps.createInstallationToken({installation_id: installation.id})
      let token = tokenResp.data.token

      try {
        await shell.cd(tempFolder)
        if (await shell.exec('git clone https://x-access-token:' + token + '@github.com/' + job.org + '/' + job.template + '.git').code != 0) {
          // mwah
        }
        if (await shell.exec('rm -rf ' + job.template + '/' + '.git').code !=0) {

        }
        if (await shell.exec('mv ' + job.template + ' ' + job.repoName).code != 0) {

        }
        await shell.cd(job.repoName)
        await shell.exec('find ./ -type f -exec sed -i "" -e "s/' + job.template + '/' + job.repoName +'/g" {} \\;')
        await shell.exec('git init')
        await shell.exec('git add *')
        await shell.exec('git commit -m "initial commit"')
        await shell.exec('git remote add origin https://x-access-token:' + token + '@github.com/' + job.org + '/' + job.repoName + '.git')
        await shell.exec('git push -u origin master')
      } catch (e) {
        console.log("caught it")
        console.log(e.name)
        reportError(e, job)
      } finally {
        shell.rm('-rf', tempFolder)
      }

    } else {
      let e = {
        name: "Template Configuration",
        message: job.template + " is not a configured template in this organization"
      }
      reportError(e, job)
    }
  }

  // handle errors and report back to user's input method
  async function reportError(error, job) {
    console.log("reporing the error")
    console.log(error.name + ": " + error.message)
    // if user sent request via RPC
    if (job.res) {

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
  const getTemplates = async (job) => {
    let templateData
    let templateYaml
    
    // check for yaml file in org/create-repository/.github/repo-me.yml
    try {
      templateData = await job.github.repos.getContent({owner: job.org, repo: job.configRepo, path: '.github/repo-me.yml'})
    } 
    catch (e) {
      reportError(e, job)
    }

    let templateBuffer = new Buffer(templateData.data.content, 'base64')

    // load fie and error if improperly formatted
    try {
      templateYaml = yaml.safeLoad(templateBuffer)
      templateYaml = templateYaml.template_repos
    }
    catch (e) {
      reportError(e, job)
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