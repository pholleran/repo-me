const repoMe = require('./repoMe')

module.exports = async (context, app) => {
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
}
