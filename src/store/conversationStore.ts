import { create } from 'zustand';
import type { Message, ProspectInfo, ConversationContext } from '../types/node.types';

interface ConversationState {
  templateId: string;
  currentPhase: string;
  conversationHistory: Message[];
  prospectInfo: ProspectInfo;
  setTemplateId: (id: string) => void;
  setCurrentPhase: (phase: string) => void;
  addMessage: (message: Message) => void;
  updateProspectInfo: (info: Partial<ProspectInfo>) => void;
  getContext: () => ConversationContext;
  clearConversation: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  templateId: 'spin-selling',
  currentPhase: 'abertura',
  conversationHistory: [],
  prospectInfo: {},

  setTemplateId: (id) => set({ templateId: id }),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  addMessage: (message) => {
    set({
      conversationHistory: [...get().conversationHistory, message],
    });
  },

  updateProspectInfo: (info) => {
    set({
      prospectInfo: { ...get().prospectInfo, ...info },
    });
  },

  getContext: () => {
    const state = get();
    return {
      templateId: state.templateId,
      currentPhase: state.currentPhase,
      conversationHistory: state.conversationHistory,
      prospectInfo: state.prospectInfo,
      previousResponses: state.conversationHistory
        .filter((m) => m.role === 'prospect')
        .map((m) => m.content),
    };
  },

  clearConversation: () => {
    set({
      conversationHistory: [],
      prospectInfo: {},
      currentPhase: 'abertura',
    });
  },
}));
