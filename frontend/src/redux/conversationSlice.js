import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: [],
    selectedConversation: null,
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload.map((conversation) => {
        const existingConversation = state.conversations.find(
          (existing) => existing._id == conversation._id,
        );
        const incomingTitle = conversation.title?.trim().toLowerCase();
        const existingTitle = existingConversation?.title?.trim();

        if (
          (!incomingTitle || incomingTitle === "new chat") &&
          existingTitle &&
          existingTitle.toLowerCase() !== "new chat"
        ) {
          return { ...conversation, title: existingTitle };
        }

        return conversation;
      });

      if (state.selectedConversation?._id) {
        const refreshedConversation = state.conversations.find(
          (conversation) =>
            conversation._id == state.selectedConversation._id,
        );

        if (refreshedConversation) {
          state.selectedConversation = refreshedConversation;
        }
      }
    },
    addConversation: (state, action) => {
      state.conversations.unshift(action.payload);
    },
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    setConvTitle: (state, action) => {
      const { title, conversationId } = action.payload;
      state.conversations = state.conversations.map((conv) =>
        conv._id == conversationId ? { ...conv, title } : conv,
      );

      if (state.selectedConversation?._id == conversationId) {
        state.selectedConversation = { ...state.selectedConversation, title };
      }
    },
  },
});

export const { setConversations, addConversation, setSelectedConversation, setConvTitle } =
  conversationSlice.actions;
export default conversationSlice.reducer;
