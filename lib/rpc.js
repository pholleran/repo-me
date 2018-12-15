const crypto = require('crypto')

exports.validateSignature = function (req) {
  const publicKey = process.env.RPC_PUBLIC_KEY
  let verifyData = req.protocol + '://' + req.hostname + ':3000' + req.originalUrl + '\n' + req.get('Chatops-Nonce') + '\n' + req.get('Chatops-Timestamp') + '\n'

  // handle a post to the listing endpoint
  if (req.method === 'POST') {
    verifyData = verifyData + JSON.stringify(req.body)
  }

  let verify = crypto.createVerify('RSA-SHA256')
  verify.write(verifyData)
  verify.end()

  let signatureHeader = req.get('Chatops-Signature')
  let sigIndex = signatureHeader.indexOf('signature')
  let signature = signatureHeader.substring(sigIndex + 10)

  return verify.verify(publicKey, signature, 'base64')
}
