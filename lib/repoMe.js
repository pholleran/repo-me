const yaml = require('js-yaml')

exports.templates = async function (job) {
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