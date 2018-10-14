const fs = require('fs')
const os = require('os')
const path = require('path')
const shell = require('shelljs')
const yaml = require('js-yaml')

exports.newRepo = async function (job, app) {
  job.templates = await templates(job)
  if (job.templates.includes(job.template)) {
    let newRepository
    try {
      // create the new repository (private is NOT default)
      // repo will be empty, but better to have this fail now then wait until after the cloning and parsing
      newRepository = await job.github.repos.createForOrg({name: job.repoName, org: job.org, private: true})
    }
    catch (e) {
      // reportError(e, job)
      reportError(e, job)
    }
    let tempFolder
    await fs.mkdtemp(path.join(os.tmpdir(), 'tmp-'), (err, folder) => {
      if (err) throw err;
      tempFolder = folder
    })
    
    // using the instance of octokit passed to this function to generate an installation token creates PEM errors
    // need to create and auth a unique one to handle the clone
    let octoclone = await app.auth()
    const { data: installation } = await octoclone.apps.findOrgInstallation({org: job.org})  // if this errors out the app is not installed in the org--need to handle
    let tokenResp = await octoclone.apps.createInstallationToken({installation_id: installation.id})
    let token = tokenResp.data.token

    try {
      await shell.cd(tempFolder)
      if (await shell.exec('git clone https://x-access-token:' + token + '@github.com/' + job.org + '/' + job.template + '.git').code != 0) {

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
      // reportError(e, job)
      console.log(e)
    } finally {
      shell.rm('-rf', tempFolder)
      return newRepository.data
    }
  } else {
    let e = {
      name: "Template Configuration",
      message: job.template + " is not a configured template in this organization"
    }
    //reportError(e, job)
    console.log(e)
  }
}

// handle errors and report back to user's input method
const reportError = exports.reportError = async (error, job) => {
  console.log("reporing the error")
  console.log(error.name + ": " + error.message)
  // if user sent request via RPC
  if (job.res) {
    console.log(error)
  } 
  // otherwise report back through GitHub
  else {
    console.log(error)
  }
}

const templates = async function (job) {
  let templateData
  let templateYaml
  // check for yaml file in org/create-repository/.github/repo-me.yml
  try {
    templateData = await job.github.repos.getContent({owner: job.org, repo: job.configRepo, path: '.github/repo-me.yml'})
  } 
  catch (e) {
    console.log(e)
    // reportError(e, job)
  }

  let templateBuffer = new Buffer(templateData.data.content, 'base64')
  // load fie and error if improperly formatted
  try {
    templateYaml = yaml.safeLoad(templateBuffer)
    templateYaml = templateYaml.template_repos
  }
  catch (e) {
    console.log(e)
    // reportError(e, job)
  }
  return templateYaml
}