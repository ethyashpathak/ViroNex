import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    if(!name||!name.trim()||!description||!description.trim()){
        throw new ApiError(400,"Fields cannot be empty")
    }
    const playlist=await Playlist.create({
        name:name,
        description:name,
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
    
})

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
            video:videoId
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
    // TODO: remove video from playlist

})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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