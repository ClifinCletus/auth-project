const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
    title:{
        type:String,
        required: [true, 'title is required!'],
        trim: true,
    },
    description:{
        type:String,
        required: [true, 'description is required!'],
        trim: true,
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // to which model it refers(like evide aan ee userId ullath). here its in the User model we created.
        required:true,
    }
},{timestamps: true})

module.exports = mongoose.model('Post', postSchema)