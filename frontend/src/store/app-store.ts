import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  id: string;
  status: string;
  info?: {
    pushname?: string;
    wid?: string;
    phone?: string;
  };
  createdAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  type: string;
  hasMedia?: boolean;
  mediaUrl?: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  lastMessage?: string;
  avatar?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  messageCount: number;
}

export interface AutoResponderRule {
  id: string;
  name: string;
  trigger: string;
  matchType: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  response: string;
  responseType: string;
  enabled: boolean;
  triggerCount: number;
  lastTriggered?: string;
  templateId?: string;
  priority: number;
}

export interface ScheduledMessage {
  id: string;
  sessionId: string;
  to: string;
  recipient: string;
  message: string;
  messageType: string;
  type: 'once' | 'recurring';
  scheduleType: 'once' | 'recurring';
  scheduledTime?: string;
  scheduledAt?: string;
  cronExpression?: string;
  enabled: boolean;
  completed: boolean;
  executionCount: number;
  status: 'pending' | 'sent' | 'failed';
  templateId?: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  usageCount: number;
}

interface AppState {
  // Sessions
  sessions: Session[];
  activeSessionId: string | null;
  setSessions: (sessions: Session[]) => void;
  setActiveSession: (id: string | null) => void;
  updateSession: (id: string, data: Partial<Session>) => void;
  removeSession: (id: string) => void;

  // Chats
  chats: Chat[];
  activeChatId: string | null;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (id: string | null) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  // Contacts
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  removeContact: (id: string) => void;

  // Auto-responders
  autoResponders: AutoResponderRule[];
  setAutoResponders: (rules: AutoResponderRule[]) => void;

  // Scheduled messages
  scheduledMessages: ScheduledMessage[];
  setScheduledMessages: (messages: ScheduledMessage[]) => void;

  // Templates
  templates: Template[];
  setTemplates: (templates: Template[]) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sessions
      sessions: [],
      activeSessionId: null,
      setSessions: (sessions) => set({ sessions }),
      setActiveSession: (id) => set({ activeSessionId: id }),
      updateSession: (id, data) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        })),

      // Chats
      chats: [],
      activeChatId: null,
      setChats: (chats) => set({ chats }),
      setActiveChat: (id) => set({ activeChatId: id }),

      // Messages
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      // Contacts
      contacts: [],
      setContacts: (contacts) => set({ contacts }),
      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),
      updateContact: (id, data) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),

      // Auto-responders
      autoResponders: [],
      setAutoResponders: (rules) => set({ autoResponders: rules }),

      // Scheduled messages
      scheduledMessages: [],
      setScheduledMessages: (messages) => set({ scheduledMessages: messages }),

      // Templates
      templates: [],
      setTemplates: (templates) => set({ templates }),

      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'wa-bot-manager-store',
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
