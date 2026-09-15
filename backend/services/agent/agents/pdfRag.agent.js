import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModels.js";
import { vectorStore } from "../config/vectorDb.js";
import { deductCredits } from "../utils/deductCredits.js";

export const pdfRag = async (state) => {
  let collectionName = null;
  let store = null;

  try {
    // 1. Read and parse PDF
    const buffer = await fs.readFile(state.file.path);
    const parser = new PDFParse({ data: buffer });
    const parsedData = await parser.getText();
    await parser.destroy();
    const text = parsedData.text?.trim();

    if (!text) {
      return {
        ...state,
        aiResponse:
          "Unable to extract text. The PDF might be scanned, password-protected, or empty.",
      };
    }

    // 2. Chunking
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([text]);

    // 3. Index into vector store
    collectionName = `pdf-${Date.now()}`;
    store = await vectorStore(docs, collectionName);

    // 4. Similarity retrieval
    const relevantDocs = await store.similaritySearch(state.prompt, 5);
    const context = relevantDocs.map((d) => d.pageContent).join("\n\n");

    // 5. Generate completion
    const llm = await getModel("pdf-rag");
    const messages = [
      new SystemMessage(`You are CortexAI PDF Assistant.

Rules:
- Answer ONLY from the uploaded PDF.
- Never make up information.
- If the answer is not present in the PDF, reply:
"I couldn't find this information in the uploaded PDF."
- Use Markdown formatting.`),
      new HumanMessage(`Context:
${context}

Question:
${state.prompt}`),
    ];

    const response = await llm.invoke(messages);

    // 6. Deduct credits on success
    if (state.userId) {
      await deductCredits(state.userId, "pdf");
    }

    return {
      ...state,
      collectionName, // Useful if you want to reuse this vector store for follow-ups
      aiResponse: response.content,
    };
  } catch (error) {
    console.error("Error in pdfRag:", error);
    return {
      ...state,
      aiResponse: "Failed to analyze PDF. Please try again.",
    };
  } finally {
    // Cleanup temporary upload from disk
    if (state.file?.path) {
      await fs.unlink(state.file.path).catch((err) => {
        console.error("Failed to delete temp PDF:", err);
      });
    }

    // Optional: If multi-turn chat is not needed, delete the Qdrant collection here
    // if (store?.client && collectionName) {
    //   await store.client.deleteCollection(collectionName).catch(console.error);
    // }
  }
};