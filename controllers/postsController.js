const { createPostSchema } = require("../middlewares/validator");
const Post = require("../models/postsModel");

exports.getPosts = async (req, res) => {
  const { page } = req.query;
  const postsPerPage = 10;

  try {
    let pageNum = 0;

    // Check if 'page' is not provided or is less than or equal to 1
    // If so, treat it as the first page (i.e., page 0 for zero-based indexing)
    if (!page || page <= 1) {
      pageNum = 0;
    } else {
      // Otherwise, use the provided page number minus one (for zero-based skip)
      pageNum = page - 1;
    }

    // Query the Post collection:
    // - Sort posts by 'createdAt' in descending order (newest first)
    // - Skip the appropriate number of documents based on page number
    // - Limit the number of posts returned per page
    // - Populate the 'userId' field with the associated user's email only
    const result = await Post.find()
      .sort({ createdAt: -1 }) // Sort by most recent posts
      .skip(pageNum * postsPerPage) // Pagination offset
      .limit(postsPerPage) // Number of posts per page
      .populate({ path: "userId", select: "email" }); // Include only the user's email from referenced user document

    // Return a successful response with the retrieved posts
    res.status(200).json({
      success: true,
      message: "posts",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

//to create a post
exports.createPost = async (req, res) => {
  const { title, description } = req.body;
  const { userId } = req.user;
  try {
    //schema to validate
    const { error, value } = createPostSchemaSchema.validate({
      title,description,userId
    });
    if (error) {
      //if error pass it
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    const result = await Post.create({title,description,userId})

    res.status(201).json({success:true, message:"post created",data:result})
  } catch (error) {
    console.log(error);
  }
};


exports.singlePost = async (req, res) => {
  const { _id } = req.query;


  try {
    const result = await Post.findOne({_id})  //id of the post created(in db, created id)
    
    if(!result){
         return res
        .status(404)
        .json({ success: false, message: 'post unavailable' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


exports.updatePost = async (req, res) => {
  const {_id} = req.query
  const { title, description } = req.body;
  const { userId } = req.user;
  try {
    //schema to validate
    const { error, value } = createPostSchemaSchema.validate({
      title,description,userId
    });
    if (error) {
      //if error pass it
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }
    const existingPost = await Post.findOne({_id})
    if(!existingPost){
         return res
        .status(404)
        .json({ success: false, message: 'post unavailable' });
    }

    //if the userId in the post is not the userId of the user(means, not the post of the user)
    if(existingPost.userId.toString() !== userId){
         return res
        .status(403)
        .json({ success: false, message: 'unAuthorized' });
    }

    
    existingPost.title=title,
    existingPost.description = description;
    const result = existingPost.save()

    res.status(200).json({success:true, message:"post updated",data:result})
  } catch (error) {
    console.log(error);
  }
};

exports.deletePost = async (req, res) => {
  const {_id} = req.query
  const { userId } = req.user;
  try {
    
    const existingPost = await Post.findOne({_id})
    if(!existingPost){
         return res
        .status(404)
        .json({ success: false, message: 'post already unavailable' });
    }

    //if the userId in the post is not the userId of the user(means, not the post of the user)
    if(existingPost.userId.toString() !== userId){
         return res
        .status(403)
        .json({ success: false, message: 'unAuthorized' });
    }

    await Post.deleteOne({_id});

    res.status(200).json({success:true, message:"post deleted"})
  } catch (error) {
    console.log(error);
  }
};

