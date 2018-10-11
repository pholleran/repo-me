const fs = require('fs')
const crypto = require('crypto')
const keyname = 'hubot-test.pub'

// load the right public key by path
// generate the signature from the passed in response

exports.validateSignature = function (verifyData, signature) {
  const publicKey = fs.readFileSync(keyname, 'utf8')

  let verify = crypto.createVerify('RSA-SHA256')
  verify.write(verifyData)
  verify.end()

  return verify.verify(publicKey, signature, 'base64')
}
