import api from '../../utils/axios'

async function sendMessage(payload) {
  try {
    const {data}=await api.post("/api/agent/chat",payload)
    return data
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Unable to send message"
    console.error("Send message failed:", message)
    throw new Error(message)
  }
}

export default sendMessage