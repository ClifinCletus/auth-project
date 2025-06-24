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

// This function creates a secure hash (HMAC) from some input value and a secret key
exports.hmacProcess = (value, key) => {
    //here we are hashing the validtioncode send to user for verifcation using hmac to improve operation speed
    // 'key' is your secret key that only you (and the receiver) should know

    // We create a hash using the SHA-256 algorithm and the secret key
    // Then we update the hash with the input value (your message)
    // Finally, we convert the result into a readable hexadecimal string
    const result = createHmac('sha256', key).update(value).digest('hex');

    return result;
}
