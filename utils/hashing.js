const {createHmac} = require('crypto')
const {hash,compare} = require('bcryptjs')

 //hashing the password
exports.doHash = (value,saltValue) =>{
    const result = hash(value, saltValue)
    return result;
}

//to compare the password provided by user during the login and compare it with the hashed password in db
exports.doHashValidation = (value,hashedValue) =>{
    const result = compare(value,hashedValue)
    return result;
}

exports.hmacProcess = (value,key) =>{ //receives a key we set in env and the verificationcode
    //here we are hashing the validtioncode send to user for verifcation using hmac to improve operatin speed
    const result = createHmac('sha256',key).update(value).digest('hex') //uses sh256 algorithm and hexcodes for hashing
    return result;
}