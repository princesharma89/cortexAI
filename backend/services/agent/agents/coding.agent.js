import { getModel } from "../config/llmModels.js";

const getModelText = (content) => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || part?.content || ""))
      .join("");
  }
  if (content && typeof content === "object") {
    return content.text || content.content || JSON.stringify(content);
  }
  return String(content ?? "");
};

const parseModelJson = (content) => {
  const text = getModelText(content).trim();
  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new SyntaxError("Coding agent did not return a JSON object");
    }
    return JSON.parse(withoutFence.slice(start, end + 1));
  }
};

export const codingAgent = async (state) => {
  const intentLlm = await getModel("intent");
  const llm = await getModel("coding");
  const intentRes = await intentLlm.invoke(`
    You are an intent classifier.

Return ONLY one of these values.

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

User Request:
${state.prompt}
    `);
  const intent = getModelText(intentRes.content).trim().toUpperCase();
  if (intent == "CODE_GENERATION") {
    const prompt = `
You are CortexAI Coding Agent.

Generate the requested project.

Default stack:
- HTML
- CSS
- JavaScript

Use React / Next.js / Vue ONLY if explicitly requested.

Rules:

- Responsive
- Modern UI
- CSS Variables
- Flexbox/Grid
- Smooth Scroll
- Hover Effects
- Beautiful spacing
- Single page unless user asks otherwise.
- Use real images from Unsplash, not placeholders.

IMAGES
======================

Always use real Unsplash images.

Never use placeholders.

Return ONLY valid JSON.

Schema:

{
  "files":[
    {
      "name":"index.html",
      "content":"..."
    },
    {
      "name":"style.css",
      "content":"..."
    },
    {
      "name":"script.js",
      "content":"..."
    }
  ]
}

Rules:

- Output must start with {
- Output must end with }
- No markdown
- No explanation
- No extra text
- No \`\`\`
- Never mention intent

User Request:
${state.prompt}
`;
    let res = await llm.invoke(prompt);
    let data;
    try {
      data = parseModelJson(res.content);
    } catch {
      res = await llm.invoke(`Return compact valid JSON only for this request. Do not use markdown fences or explanations. Include exactly three short files: index.html, style.css, and script.js. Use this schema: {"files":[{"name":"index.html","content":"..."},{"name":"style.css","content":"..."},{"name":"script.js","content":"..."}]}. Request: ${state.prompt}`);
      try {
        data = parseModelJson(res.content);
      } catch {
        return {
          ...state,
          aiResponse: getModelText(res.content) || "The coding model did not return usable code.",
          artifacts: [],
        };
      }
    }
    return {
      ...state,
      aiResponse: "Code Generated Successfully.",
      artifacts: [
        {
          id: Date.now(),
          type: "Project",
          files: data.files || [],
          title: state.prompt, 
        },
      ],
    };
  }
  const res = await llm.invoke(`
  The user's request is:

${intent}

Return Markdown only.

Never generate project files.

Use headings like:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code (if needed)

User Request:

${state.prompt}
`);
const data=res.content
return {
  ...state,
  aiResponse:data,
  artifacts:[],
}
};
