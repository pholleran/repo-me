const fs = require('fs')
const os = require('os')
const path = require('path')
const shell = require('shelljs')
const yaml = require('js-yaml')

// comment on an issue, update existing if present
const commentOnIssue = exports.commentOnIssue = async (context, commentBody, closeAfterComment) => {
  // determine if there is already a comment on this PR from this app
  let thread = await context.issue()
  let issueNumber = thread.number
  let comments = await context.github.issues.getComments(context.issue({ issueNumber }))
  let comment = comments.data.find(comment => comment.user.login === process.env.APP_NAME + '[bot]')

  // if there is, edit that one
  if (typeof comment !== 'undefined' && comment) {
    context.github.issues.editComment(context.issue({ body: commentBody, comment_id: comment.id }))

  // otherwise create a new one
  } else {
    context.github.issues.createComment(context.issue({ body: commentBody }))
  }

  if (closeAfterComment === true) {
    context.github.issues.edit(context.issue({ state: 'closed' }))
  }
}

exports.newRepo = async (job, app) => {
  job.templates = await templates(job)

  if (validTemplate(job)) {
    let newRepository = await job.github.repos.createForOrg({ name: job.repoName, org: job.org, private: true }).catch((e) => reportError(JSON.parse(e), job))
    let tempFolder = await fs.mkdtempSync(path.join(os.tmpdir(), 'tmp-'))

    // make sure we have a repo
    if (typeof newRepository !== 'undefined' && newRepository) {
      // using the instance of octokit passed to this function to generate an installation token creates PEM errors
      // we need to create and auth a unique one to handle the clone
      let octoclone = await app.auth()
      const { data: installation } = await octoclone.apps.findOrgInstallation({ org: job.org })
      let tokenResp = await octoclone.apps.createInstallationToken({ installation_id: installation.id })
      let token = tokenResp.data.token
      try {
        await shell.cd(tempFolder)
        if (await shell.exec('git clone https://x-access-token:' + token + '@github.com/' + job.org + '/' + job.template + '.git').code !== 0) { }
        if (await shell.exec('rm -rf ' + job.template + '/' + '.git').code !== 0) { }
        if (await shell.exec('mv ' + job.template + ' ' + job.repoName).code !== 0) { }
        await shell.cd(job.repoName)
        await shell.exec('find ./ -type f -exec sed -i "" -e "s/' + job.template + '/' + job.repoName + '/g" {} \\;')
        await shell.exec('git init')
        await shell.exec('git add *')
        await shell.exec('git commit -m "initial commit"')
        await shell.exec('git remote add origin https://x-access-token:' + token + '@github.com/' + job.org + '/' + job.repoName + '.git')
        await shell.exec('git push -u origin master')
      } catch (e) {
        reportError(e, job)
      } finally {
        shell.rm('-rf', tempFolder)
      }
    }
    if (newRepository) {
      return newRepository.data
    } else {
      return 0
    }
  } else {
    let e = {
      message: '`' + job.template + '` is not a configured template in this organization'
    }
    reportError(e, job)
  }
}

// handle errors and report back to user's input method
const reportError = exports.reportError = async (e, job) => {
  let message = e.message
  // if this was a GitHub API error, get the message and reason
  if (e.errors) {
    message = message + ' ' + e.errors[0].message
  }
  // if user sent request via RPC
  if (job.res) {
    job.res.send({ 'result': message })
  } else {
    message = message + '\n\nUpdate your original post to retry.'
    commentOnIssue(job.context, message)
  }
}

const templates = async (job) => {
  let templateData
  let templateYaml
  // check for yaml file in org/create-repository/.github/repo-me.yml
  try {
    templateData = await job.github.repos.getContent({ owner: job.org, repo: job.configRepo, path: '.github/repo-me.yml' })
  } catch (e) {
    reportError(e, job)
  }

  let templateBuffer = Buffer.from(templateData.data.content, 'base64')
  // load fie and error if improperly formatted
  try {
    templateYaml = yaml.safeLoad(templateBuffer)
    templateYaml = templateYaml.template_repos
  } catch (e) {
    reportError(e, job)
  }
  return templateYaml
}

const validTemplate = (job) => {
  return job.templates.includes(job.template)
}
