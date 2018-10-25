module.exports = async (req, res) => {
  const rpc = require('../lib/rpc')

  if (await rpc.validateSignature(req) === true) {
    res.setHeader('Content-Type', 'application/json')
    res.send(listing)
    return listing
  } else {
    res.send('signature not valid')
  }
}

// the JSON structure returned by `/_chatops`
const listing = JSON.stringify({
  namespace: 'repo',
  version: 2,
  error_response: 'More information is perhaps available [in haystack](https://example.com)',
  methods: {
    create: {
      help: 'create <more help soon>',
      regex: '(?:create)(?: (?<org>\\S+) (?<repoName>\\S+) (?<template>\\S+))?',
      params: [
        'org', 'repoName', 'template'
      ],
      path: 'repo'
    }
  }
})
