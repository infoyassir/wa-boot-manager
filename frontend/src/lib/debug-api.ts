import axios from 'axios';
import { API_URL, API_KEY } from './config';

const debugApi = axios.create({
  baseURL: `${API_URL}/api/debug`,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

// ==================== MESSAGING ====================

export const messagingApi = {
  sendText: (sessionId: string, to: string, message: string) =>
    debugApi.post('/send-text', { sessionId, to, message }),

  sendImage: (sessionId: string, to: string, imageUrl: string, caption?: string) =>
    debugApi.post('/send-image', { sessionId, to, imageUrl, caption }),

  sendAudio: (sessionId: string, to: string, audioUrl: string, ptt?: boolean) =>
    debugApi.post('/send-audio', { sessionId, to, audioUrl, ptt }),

  sendVideo: (sessionId: string, to: string, videoUrl: string, caption?: string) =>
    debugApi.post('/send-video', { sessionId, to, videoUrl, caption }),

  sendDocument: (sessionId: string, to: string, documentUrl: string, filename?: string) =>
    debugApi.post('/send-document', { sessionId, to, documentUrl, filename }),

  sendSticker: (sessionId: string, to: string, stickerUrl: string) =>
    debugApi.post('/send-sticker', { sessionId, to, stickerUrl }),

  sendLocation: (sessionId: string, to: string, latitude: number, longitude: number, description?: string) =>
    debugApi.post('/send-location', { sessionId, to, latitude, longitude, description }),

  sendContact: (sessionId: string, to: string, contactId: string) =>
    debugApi.post('/send-contact', { sessionId, to, contactId }),

  replyMessage: (sessionId: string, messageId: string, reply: string) =>
    debugApi.post('/reply-message', { sessionId, messageId, reply }),

  reactMessage: (sessionId: string, messageId: string, emoji: string) =>
    debugApi.post('/react-message', { sessionId, messageId, emoji }),

  createPoll: (sessionId: string, to: string, pollName: string, options: string[], allowMultiple?: boolean) =>
    debugApi.post('/create-poll', { sessionId, to, pollName, options, allowMultiple }),

  sendMention: (sessionId: string, to: string, message: string, mentions: string[]) =>
    debugApi.post('/send-mention', { sessionId, to, message, mentions }),
};

// ==================== CONTACTS ====================

export const contactsApi = {
  getInfo: (sessionId: string, contactId: string) =>
    debugApi.get(`/contact/${sessionId}/${encodeURIComponent(contactId)}`),

  getProfilePicture: (sessionId: string, contactId: string) =>
    debugApi.get(`/profile-picture/${sessionId}/${encodeURIComponent(contactId)}`),

  block: (sessionId: string, contactId: string) =>
    debugApi.post('/block-contact', { sessionId, contactId }),

  unblock: (sessionId: string, contactId: string) =>
    debugApi.post('/unblock-contact', { sessionId, contactId }),
};

// ==================== CHATS ====================

export const chatsApi = {
  getAll: (sessionId: string) =>
    debugApi.get(`/chats/${sessionId}`),

  mute: (sessionId: string, chatId: string, duration?: number) =>
    debugApi.post('/mute-chat', { sessionId, chatId, duration }),

  unmute: (sessionId: string, chatId: string) =>
    debugApi.post('/unmute-chat', { sessionId, chatId }),

  getMessages: (sessionId: string, chatId: string, limit?: number) =>
    debugApi.get(`/messages/${sessionId}/${encodeURIComponent(chatId)}`, { params: { limit } }),
};

// ==================== GROUPS ====================

export const groupsApi = {
  create: (sessionId: string, name: string, participants: string[]) =>
    debugApi.post('/create-group', { sessionId, name, participants }),

  getInvite: (sessionId: string, groupId: string) =>
    debugApi.get(`/group-invite/${sessionId}/${encodeURIComponent(groupId)}`),

  join: (sessionId: string, inviteCode: string) =>
    debugApi.post('/join-group', { sessionId, inviteCode }),

  leave: (sessionId: string, groupId: string) =>
    debugApi.post('/leave-group', { sessionId, groupId }),

  getInfo: (sessionId: string, groupId: string) =>
    debugApi.get(`/group-info/${sessionId}/${encodeURIComponent(groupId)}`),

  setSubject: (sessionId: string, groupId: string, subject: string) =>
    debugApi.post('/group-subject', { sessionId, groupId, subject }),

  setDescription: (sessionId: string, groupId: string, description: string) =>
    debugApi.post('/group-description', { sessionId, groupId, description }),

  addParticipants: (sessionId: string, groupId: string, participants: string[]) =>
    debugApi.post('/group-add', { sessionId, groupId, participants }),

  removeParticipants: (sessionId: string, groupId: string, participants: string[]) =>
    debugApi.post('/group-remove', { sessionId, groupId, participants }),

  promoteParticipants: (sessionId: string, groupId: string, participants: string[]) =>
    debugApi.post('/group-promote', { sessionId, groupId, participants }),

  demoteParticipants: (sessionId: string, groupId: string, participants: string[]) =>
    debugApi.post('/group-demote', { sessionId, groupId, participants }),

  setSettings: (sessionId: string, groupId: string, messagesAdminsOnly?: boolean, infoAdminsOnly?: boolean) =>
    debugApi.post('/group-settings', { sessionId, groupId, messagesAdminsOnly, infoAdminsOnly }),
};

// ==================== STATUS ====================

export const statusApi = {
  set: (sessionId: string, status: string) =>
    debugApi.post('/set-status', { sessionId, status }),

  getMe: (sessionId: string) =>
    debugApi.get(`/me/${sessionId}`),
};

// ==================== CHANNELS ====================

export const channelsApi = {
  getAll: (sessionId: string) =>
    debugApi.get(`/channels/${sessionId}`),
};

// ==================== MESSAGES ====================

export const messagesApi = {
  downloadMedia: (sessionId: string, messageId: string) =>
    debugApi.get(`/download-media/${sessionId}/${encodeURIComponent(messageId)}`),

  star: (sessionId: string, messageId: string, star: boolean) =>
    debugApi.post('/star-message', { sessionId, messageId, star }),

  delete: (sessionId: string, messageId: string, everyone?: boolean) =>
    debugApi.post('/delete-message', { sessionId, messageId, everyone }),

  forward: (sessionId: string, messageId: string, to: string) =>
    debugApi.post('/forward-message', { sessionId, messageId, to }),
};
