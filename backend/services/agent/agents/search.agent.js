import { searchTool } from "../config/tavily.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkLimits } from "../utils/checkLimits.js"

export const searchAgent=async (state) => {
    try {
             await checkLimits(state.userId, "search");
        const results=await searchTool.invoke({
            query:state.prompt
        })
        await deductCredits(state.userId, "search");
        console.log(results)
        return {
            ...state,
            searchResults:results,
            images:results.images
        }
    } catch (error) {
        return {
            ...state,
            searchResults:[],
            images:[],
            aiResponse: error?.data?.message || "❌ Failed to perform search."
        }
    }
}