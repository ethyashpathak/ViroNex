import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import { Video } from "../models/video.model.js"


const getVideoComments = asynchandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Aggregation pipeline to get comments with owner details
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $sort: {
                createdAt: -1 // Newest comments first
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limitNumber
        },
        {
            $project: {
                _id: 1,
                content: 1,
                video: 1,
                owner: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);
    
    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ video: videoId });
    const totalPages = Math.ceil(totalComments / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    comments,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalComments,
                        limit: limitNumber,
                        hasNextPage,
                        hasPrevPage
                    }
                },
                "Comments fetched successfully"
            )
        );
});

const addComment = asynchandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content}=req.body;
    const {videoId}=req.params;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }  

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(401,"Not a valid id")
    }

    const vdo= await Video.findById(videoId)

    if(!vdo){
        throw new ApiError(404,"Video not found")
    }

    const comm=await Comment.create({
        content:content.trim(),
        video:videoId,
        owner:req.user._id
    })

    if(!comm){
        throw new ApiError(500,"Something went wrong")
    }
    const newComment = await Comment.findById(comm._id).populate(
      "owner", 
      "fullName avatar username"
    );

    return res
    .status(200)
    .json(new ApiResponse(200,newComment,"Comment added sucessfully"))
})

const updateComment = asynchandler(async (req, res) => {
    const {content}=req.body;
    const {commentId}=req.params;

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }  
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(401,"not a valid id")
    }

    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }
    const comm=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content.trim(),
            }
        },
         {new:true}
    )

    if(!comm){
        throw new ApiError(500,"something went wrong")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comm,"comment updated successfully"))
    

})

const deleteComment = asynchandler(async (req, res) => {
    const {commentId}=req.params

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(401,"Not a valid id")
    }

    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment deleted sucessfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }