import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"


const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    if(!name||!name.trim()||!description||!description.trim()){
        throw new ApiError(400,"Fields cannot be empty")
    }
    const playlist=await Playlist.create({
        name:name.trim(),
        description:description.trim(),
        owner:req.user._id
    })
    if(!playlist){
        throw new ApiError(500,"Something went wrong")
    }

    return res
    .status(201)
    .json(new ApiResponse(200,playlist,"Playlist created sucessfully"))
    
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
        const { page = 1, limit = 10 } = req.query;
        
        // Validate userId
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID");
        }
        
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        
        
        const playlist = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
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
                    createdAt: -1 // Newest tweets first
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
                    owner: 1,
                    ownerDetails: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);
        
        // Get total count for pagination
        const totalPlaylist = await Playlist.countDocuments({ owner: userId });
        const totalPages = Math.ceil(totalPlaylist / limitNumber);
        const hasNextPage = pageNumber < totalPages;
        const hasPrevPage = pageNumber > 1;
        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        playlist,
                        pagination: {
                            currentPage: pageNumber,
                            totalPages,
                            totalPlaylist,
                            limit: limitNumber,
                            hasNextPage,
                            hasPrevPage
                        }
                    },
                    "User playlist fetched successfully"
                )
            );
});


const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params
   if(!isValidObjectId(playlistId)){
      throw new ApiError(400,"Not a valid id")
   }
   const playlist=await Playlist.findById(playlistId)

   if(!playlist){
     throw new ApiError(404,"Not found")
   }
   
   return res
   .status(200)
   .json(new ApiResponse(200,playlist,"Playlist found sucessfully"))


})

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
      throw new ApiError(400,"Not a valid id")
   }
   const play=await Playlist.findById(playlistId)
   const video=await Video.findById(videoId)
   if(!play || !video ){
     throw new ApiError(404,"Not found video/playlist")
   }
    if (play.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to modify this playlist");
    }
    const videoExists = play.videos.some(vid => vid.toString() === videoId);
    if(videoExists){
        throw new ApiError(400,"Video already in playlist")
    }


    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
          $addToSet:{
            videos:videoId
          }
        },
        {new:true}
    
    )
    
    if(!playlist){
        throw new ApiError(500,"something went wrong")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added successfully"));
})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
      throw new ApiError(400,"Not a valid id")
   }
   const play=await Playlist.findById(playlistId)
   const video=await Video.findById(videoId)
   if(!play || !video ){
     throw new ApiError(404,"Not found video/playlist")
    }
    if (play.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    const videoExists = play.videos.some(vid => vid.toString() === videoId);
    if(!videoExists){
        throw new ApiError(400,"Video not in playlist")
    }

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
          $pull:{
            videos:videoId
          }
        },
        {new:true}
    
    )
    
    if(!playlist){
        throw new ApiError(500,"something went wrong")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed successfully"));

})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
     if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"not a valid id")
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }
    
    await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Playlist removed sucessfully"))
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
   if (!name && !description) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateFields={}

    if(name) updateFields.name=name;
    if(description) updateFields.description=description
    
    const existingPlaylist=await Playlist.findById(playlistId);
    if(!existingPlaylist){
        throw new ApiError(404,"Playlist not found")
    }

    if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }


    const playlist=await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set:updateFields
    },
    {new:true}

  )
  
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated sucessfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}