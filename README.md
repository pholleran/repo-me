# repo-me

repo-me is a GitHub App, built with [Probot](https://github.com/probot/probot), to automate the creation and scaffolding of repositories based on configured templates.

## How it works

To create a new repo users of repo-me open up a new issue in the `create-repository` repo within their organization. The desired name for the new repository, as well as the template on which it will be based, are included in the opening post in the issue. repo-me then creates the issue and posts the link to the new repo before closing the issue.

For organizations utilizing [chatOps RPC](https://github.com/bhuga/hubot-chatops-rpc), repo-me can be used within your configured chat client.

## Setup

Setting up repo-me requires:

1. Installation and deployment of repo-me
2. Configuration of the `create-repository` repo
3. Creation of template repositories
4. (optionally) configuring the chatOps RPC endpoint

### 1. Installing and deploying repo-me

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

### 2. Configuring `create-repository`

repo-me requires used of a repository called `create-repository` in the organization in which the app is installed. This repository is used to:

* store the organization's configuration of repo-me
* create new repositories by opening up issues based on a configured [issue template](https://help.github.com/articles/about-issue-and-pull-request-templates/)

an example configuration of `create-repository` can be cloned from [here]()

### 3. Creating template repositories

Any repository within an organization can serve as a template. Repository contents of new repos will be duplicates of the template on which they are based, with any reference to the template name the repo replaced with the new repository name.

For a repository to be available as a template in repo-me, it must be configured. Simply add repo names (one per line) to the `template_repos:` section of the `.github\repo-me.yml` file in `create-repository`.

#### 3.5 Automating configuration of template repositories

repo-me will not configure administrative settings of any repos it creates. To automate the setup of repository settings, consider installing [probot-settings](https://github.com/apps/settings) on all repositories in your organization. If your template includes a `settings.yml` file, `probot-settings` will apply the settings upon creation of the new repository.

### 4. Configuring chatOps RPC



## Contributing

If you have suggestions for how repo-me could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2018 Philip Holleran <pholleran@github.com>
