import { getModel } from "../config/llmModels.js";
import { generatePpt } from "../utils/generatePpt.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkLimits } from "../utils/checkLimits.js";

export const pptAgent = async (state) => {
  try {
    await checkLimits(state.userId, "ppt");
    const llm = await getModel("ppt");
    const userPrompt = state?.prompt || state?.messages?.slice(-1)[0]?.content;

    if (!userPrompt) {
      throw new Error("No topic or prompt found in state.");
    }

    const prompt = `You are a professional presentation designer.

Return ONLY valid JSON matching this schema:
{
  "title": "Presentation Title",
  "subtitle": "Brief subtitle or presentation overview",
  "slides": [
    {
      "title": "Slide Title",
      "points": [
        "Point 1",
        "Point 2",
        "Point 3",
        "Point 4"
      ]
    }
  ]
}

Rules:
- Generate exactly 6 content slides.
- Each slide should have 4 to 6 concise bullet points.
- Do NOT wrap output in markdown code blocks (\`\`\`json).
- Return strictly raw JSON.

Topic:
${userPrompt}`;

    const res = await llm.invoke(prompt);

    // Clean potential markdown fences or leading/trailing whitespace
    const rawContent = (typeof res.content === "string" ? res.content : JSON.stringify(res.content))
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const data = JSON.parse(rawContent);
    await deductCredits(state.userId, "ppt");
    // Generate presentation buffer
    const ppt = await generatePpt(data);
    const buffer = await ppt.write({ outputType: "nodebuffer" });

    // S3 Storage & Pre-signed URL (24 hours = 86400 seconds)
    const expiresInSeconds = 24 * 60 * 60;
    const filename = `ppt-${Date.now()}.pptx`;
    const mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    await uploadToS3(filename, buffer, mimeType);
    const downloadUrl = await getFromS3(filename, expiresInSeconds);

    return {
      ...state,
      aiResponse: `# Presentation Generated

**${data.title}**
_${data.subtitle || ""}_

📩 [Download Presentation](${downloadUrl})

_Link expires in 24 hours._`,
      metadata: {
        slideCount: data?.slides?.length || 0,
        filename,
        downloadUrl,
      },
    };
  } catch (error) {
    console.error("Error in pptAgent:", error);
    return {
      ...state,
      aiResponse: "Failed to generate presentation. Please try again with a more specific topic.",
      error: error.message,
    };
  }
};