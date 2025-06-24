const mongoose = require('mongoose')


const userSchema = mongoose.Schema({
    email:{
        type:String,
        required: [true,'Email is required'], //if not provided, show the message
        trim: true, //if provided an email with spaces at start and end, auto trim it
        unique: [true,'Email must be unique! '],
        minLength: [5,'Email must have 5 characters! '],
        lowercase:true, //auto convert all letters to lowercase
    },
    password: {
        type: String,
        required: [true,'Password must be provided'],
        trim: true, 
        select: false, //until we not explicitily say to get password, not include it while getting user details from db
    },
    verified:{ //to verify the user, if initially came, not verified, then after some steps, they would become verified
        type: Boolean,
        default: false,
    },
    verificationCode:{ //for storing codes we send to users for verification
        type:String,
        select: false,
    },
    verificationCodeValidation:{ // for validation.here sets the date time when the verification code have been added to the db, to make validation code in db, expires after some time
        type:Number,
        select: false,
    },
    forgotPasswordCode:{ //codes we send to users for forgotpassword
        type:String,
        select: false,
    },
    forgotPasswordCodeValidation:{ //for validation
        type:Number,
        select: false,
    },
},
{timestamps: true} // while creating any record, tracks the time created
)

module.exports = mongoose.model('User',userSchema)

