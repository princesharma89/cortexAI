import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"

export const createConversation=async (req,res) => {
    try {
        const userId=req.headers["x-user-id"]
        console.log("userId",userId)
        const conversation=await Conversation.create({
            userId:userId
        })

        return res.status(200).json(conversation)
    } catch (error) {
        return res.status(500).json({message:`create conversation error ${error}`})
    }
}
export const getConversations=async (req,res) => {
    try {
        const userId=req.headers["x-user-id"]
        console.log("userId",userId)
        const conversations=await Conversation.find({
            userId:userId
        }).sort({createdAt:-1})

        return res.status(200).json(conversations)
    } catch (error) {
        return res.status(500).json({message:`get conversation error ${error}`})
    }
}
export const updateConversation=async (req,res) => {
    try {
        const {id,title}=req.body
        if (!id || !title?.trim()) {
            return res.status(400).json({message:"conversation id and title are required"})
        }

        const conversation=await Conversation.findByIdAndUpdate(
            id,
            { title: title.trim() },
            { new: true, runValidators: true }
        )

        if (!conversation) {
            return res.status(404).json({message:"conversation not found"})
        }

        return res.status(200).json(conversation)
    } catch (error) {
        return res.status(500).json({message:`update conversation error ${error}`})
    }
}
export const setConversationTitle=async (req,res) => {
    try {
        const {id,title}=req.body
        if (!id || !title?.trim()) {
            return res.status(400).json({message:"conversation id and title are required"})
        }

        const conversation=await Conversation.findOneAndUpdate(
            { _id:id, $or:[{title:"New Chat"},{title:{$exists:false}},{title:null}] },
            { title:title.trim() },
            { new:true, runValidators:true }
        )

        return res.status(200).json(conversation)
    } catch (error) {
        return res.status(500).json({message:`set conversation title error ${error}`})
    }
}
export const saveMessage=async (req,res) => {
    try {
        const {conversationId,role,content,images,artifacts}=req.body
        const message=await Message.create({
            conversationId,
            content,
            role,
            images,
            artifacts
        })
        return res.status(200).json(message)
    } catch (error) {
        return res.status(500).json({message:`save message error ${error}`})
    }
}
export const getMessages=async (req,res) => {
    try {

        const messages=await Message.find({
            conversationId: req.params.conversationId
        }).sort({createdAt:1})
        return res.status(200).json(messages)
    } catch (error) {
        return res.status(500).json({message:`get messages error ${error}`})
    }
}