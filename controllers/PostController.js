import PostModel from "../models/postModel.js";
import UserModel from "../models/userModel.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({ 
  cloud_name: 'ddrw5stax', 
  api_key: '987139284143613', 
  api_secret: 'Lt-2L3b7S9OGHXEUS1590r9OH2A' 
});

// creating a post

export const createPost = async (req, res) => {
  if(req.files && req.files.image) {
    const file = req.files.image;
    cloudinary.uploader.upload(file.tempFilePath,(err,result)=>{
      const newPost = new PostModel({
        _id: new mongoose.Types.ObjectId,
        userId: req.body.userId,
        desc: req.body.desc,
        image: result.url,
        createdAt: new Date()
      });
      newPost.save().then(result=>{
        res.status(200).json(result);
      }).catch(error=>{
        res.status(500).json(error);
      })
    })
  }
  else{
    const newPost = new PostModel({
      _id: new mongoose.Types.ObjectId,
      userId: req.body.userId,
      desc: req.body.desc,
      createdAt: new Date()
    });
    newPost.save().then(result=>{
      res.status(200).json(result);
    }).catch(error=>{
      res.status(500).json(error);
    })
  }  
};
// get a post
export const getPost = async (req, res) => {
  const id = req.params.id;

  try {
    const post = await PostModel.findById(id);
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
};

// update post
export const updatePost = async (req, res) => {
  const postId = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(postId);
    if (post.userId === userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("Post updated!");
    } else {
      res.status(403).json("Authentication failed");
    }
  } catch (error) {}
};

// delete a post
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;

  try {
    const post = await PostModel.findById(id);
    if (post.userId === userId) {
      await post.deleteOne();
      res.status(200).json("Post deleted.");
    } else {
      res.status(403).json("Action forbidden");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// like/dislike a post
export const likePost = async (req, res) => {
  const id = req.params.id;
  const { userId } = req.body;
  try {
    const post = await PostModel.findById(id);
    if (post.likes.includes(userId)) {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json("Post disliked");
    } else {
      await post.updateOne({ $push: { likes: userId } });
      res.status(200).json("Post liked");
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

// Get timeline posts
export const getTimelinePosts = async (req, res) => {
  const userId = req.params.id
  try {
    const currentUserPosts = await PostModel.find({ userId: userId });

    const followingPosts = await UserModel.aggregate([
      { 
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "following",
          foreignField: "userId",
          as: "followingPosts",
        },
      },
      {
        $project: {
          followingPosts: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(
      currentUserPosts
        .concat(...followingPosts[0].followingPosts)
        .sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
    );
  } catch (error) {
    res.status(500).json(error);
  }
};
