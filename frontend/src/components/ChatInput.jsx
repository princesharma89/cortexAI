import { Paperclip, Mic } from 'lucide-react'
import { Send } from 'lucide-react'
import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import sendMessage from '../features/sendMessage'
import { useDispatch } from 'react-redux'
import { addMessage, setIsLoading } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { setSelectedConversation } from '../redux/conversationSlice'
import { addConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'
import { setConvTitle } from '../redux/conversationSlice'
import { setArtifacts } from '../redux/messageSlice'
import { Zap, MessageSquare, Code2, FileText, Presentation, ImageIcon, Globe,X } from 'lucide-react'


function ChatInput() {
    const [value, setValue] = useState("")
    const [selectedAgent, setSelectedAgent] = useState("Auto")
    const [isSending, setIsSending] = useState(false)
    const [sendError, setSendError] = useState("")
    const { selectedConversation } = useSelector(state => state.conversation)
    const [selectedFile, setSelectedFile] = useState(null)
    const fileInputRef = useRef(null)
    const dispatch = useDispatch()
    const handleSendMessage = async () => {
        dispatch(setIsLoading(true))
        if (isSending || !value.trim()) {
            return
        }

        setSendError("")
        setIsSending(true)
        const prompt = value.trim()

        try {
            let conversation = selectedConversation
            if (!conversation) {
                const conv = await createConversation()
                if (!conv?._id) {
                    throw new Error("Could not create a conversation. Please log in again.")
                }
                dispatch(setSelectedConversation(conv))
                dispatch(addConversation(conv))
                conversation = conv
            }

            if (!conversation?._id) {
                throw new Error("No conversation selected")
            }

            const currentTitle = conversation.title?.trim().toLowerCase()
            if (!currentTitle || currentTitle === "new chat") {
                const title = value.trim().slice(0, 80)
                dispatch(setConvTitle({
                    conversationId: conversation._id,
                    title
                }))

                const updatedConversation = await updateConversation({
                    id: conversation._id,
                    title
                })
                if (!updatedConversation?.title) {
                    throw new Error("Conversation title could not be saved")
                }
                dispatch(setConvTitle({
                    conversationId: conversation._id,
                    title: updatedConversation.title
                }))
            }

            const agent = selectedAgent.toLowerCase() === "image"
                ? "vision"
                : selectedAgent.toLowerCase()
            const formData = new FormData();
            formData.append("prompt", value.trim());
            formData.append("conversationId", conversation?._id);
            formData.append("agent", selectedAgent.toLowerCase());
            if(selectedFile){
                formData.append("file", selectedFile);
            }
            dispatch(addMessage({ role: "user", content: prompt }))
            setValue("")
            const data = await sendMessage(formData)
            dispatch(setIsLoading(false))
            setSelectedFile(null)
            dispatch(setArtifacts(data?.artifacts || []))
            dispatch(addMessage({ role: "assistant", content: data?.answer, images: data?.images }))
            console.log(data)
        } catch (error) {
            setSendError(error.message)
        } finally {
            setIsSending(false)
        }
    }
    const agents = [
        {
            id: "auto",
            icon: Zap,
            label: "Auto"
        },
        {
            id: "chat",
            icon: MessageSquare,
            label: "Chat"
        },
        {
            id: "coding",
            icon: Code2,
            label: "Coding"
        },
        {
            id: "pdf",
            icon: FileText,
            label: "PDF"
        },
        {
            id: "ppt",
            icon: Presentation,
            label: "PPT"
        },
        {
            id: "vision",
            icon: ImageIcon,
            label: "Vision"
        },
        {
            id: "search",
            icon: Globe,
            label: "Search"
        }
    ]
    return (
        <div className='w-full overflow-hidden px-3 md:px-5 py-4 border-t border-white/[0.06] bg-[#0d0f14]'>
            <div className='flex flex-col gap-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 pt-3.5 pb-3'>
                <div className='flex w-[80%] gap-2 pr-2 flex-wrap'>
                    {agents.map((agent) => {
                        const isActive = selectedAgent === agent.label
                        const Icon = agent.icon
                        return (
                            <div onClick={() => !isSending && setSelectedAgent(agent.label)} key={agent.id}
                                className={`
                                    flex-shrink-0
                                    cursor-pointer
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    px-3
                                    py-2
                                    rounded-full
                                    text-xs
                                    font-medium
                                    border
                                    transition-all
                                    ${isActive
                                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,.35)]"
                                        : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                                    }
                                ${isSending ? "opacity-50 cursor-not-allowed" : ""}
                                `}>
                                <Icon size={14}
                                    className={
                                        isActive
                                            ? "text-white"
                                            : "text-slate-500"
                                    } />

                                {agent.label}
                            </div>
                        )
                    })}
                </div>
                {
                    selectedFile && (
                        <div className='my-3'>
                            <div className='inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2'>
                                {selectedFile?.type === "application/pdf" ? (
                                    <FileText size={16} className="text-red-400" />
                                ) : (
                                    selectedFile?.type?.startsWith("image/") && (
                                        <img
                                            src={URL.createObjectURL(selectedFile)}
                                            alt="preview"
                                            className="h-10 w-10 rounded-xl object-cover"
                                        />
                                    )
                                )}
                                 <div>
                                <p className='text-xs text-white'>
                                    {selectedFile?.name}
                                </p>
                                <p className='text-[10px] text-slate-500'>
                                    {Math.ceil(selectedFile?.size / 1024)} KB
                                </p>
                            </div>
                            <button
                                className='ml-2'
                                onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            >
                                <X size={14} className='text-slate-500 hover:text-white' />
                            </button>

                            </div>
                           
                        </div>
                    )
                }


                <textarea
                    placeholder='Ask Anything...'
                    disabled={isSending}
                    className="w-full bg-transparent outline-none resize-none text-[14px] text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
                    rows={3}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1'>
                        <input type="file" accept='.pdf,image/*' hidden ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                    setSelectedFile(file)
                                }
                            }}
                        />
                        <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer' onClick={() => fileInputRef.current?.click()}>
                            <Paperclip size={16} />
                        </button>
                        <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer'>
                            <Mic size={16} />
                        </button>
                    </div>
                    <button
                        disabled={!value.trim() || isSending}
                        onClick={handleSendMessage}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer transition-all duration-150 ${value.trim() && !isSending ? "bg-linear-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white" : "bg-white/[0.05] text-slate-600 cursor-not-allowed"}`}>
                        <Send size={15} />
                    </button>
                </div>
                {sendError && <p className='text-xs text-red-400'>{sendError}</p>}
            </div>
        </div>
    )
}

export default ChatInput