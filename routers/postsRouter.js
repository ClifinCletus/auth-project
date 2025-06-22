const express = require("express");
const postsController = require("../controllers/postsController"); //stores all the functions where the logic is added(req,res)
const router = express.Router();
const { identifier } = require("../middlewares/identification");


router.get("/all-posts", postsController.getPosts);
router.get("/single-post", postsController.singlePost);
router.post("/create-post",identifier, postsController.createPost);

router.put(
  "/update-post",
  identifier,
  postsController.updatePost
);
router.delete(
  "/delete-post",
  identifier,
  postsController.deletePost
);


module.exports = router;
