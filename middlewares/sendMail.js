const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
    service: 'gmail', //can send 500 per day 
    auth: {
        user: process.env.NODE_CODE_SENDER_EMAIL_ADDRESS ,
        pass: process.env.NODE_CODE_SENDER_EMAIL_PASSWORD, 
    }
})


module.exports = transport