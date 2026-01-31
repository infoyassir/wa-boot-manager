'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { messageApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  MapPin,
  Loader2,
  Search,
  Phone,
  Video,
  FileAudio,
  File,
  Download,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Chat, Message } from '@/store/app-store';
import axios from 'axios';
import { API_URL, API_KEY } from '@/lib/config';

// API pour envoyer des médias
const sendMediaApi = axios.create({
  baseURL: `${API_URL}/api/debug`,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
});

export function ChatInterface() {
  const { activeSessionId, chats, setChats, messages, setMessages, addMessage } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media dialog states
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);

  // Media form states
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationDesc, setLocationDesc] = useState('');
  const [attachmentType, setAttachmentType] = useState<'video' | 'audio'>('video');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentCaption, setAttachmentCaption] = useState('');

  // File upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [refreshing, setRefreshing] = useState(false);

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Load chats when session changes
  useEffect(() => {
    if (activeSessionId) {
      loadChats();
      setupSocketListeners();
    }
  }, [activeSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setupSocketListeners = () => {
    const socket = getSocket();

    socket.on('message:received', ({ sessionId, message }) => {
      if (sessionId === activeSessionId) {
        addMessage(message);
        if (message.from !== selectedChat?.id) {
          toast.info(`Nouveau message de ${message.from}`);
        }
      }
    });
  };

  const loadChats = async () => {
    if (!activeSessionId) return;

    setIsLoading(true);
    try {
      const response = await messageApi.getChats(activeSessionId);
      if (response.data.success) {
        setChats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading chats:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        if (errorMsg.includes('not ready')) {
          toast.error(`Session ${activeSessionId} n'est pas prête. Veuillez scanner le QR code d'abord.`);
        } else if (errorMsg.includes('not found')) {
          toast.error(`Session ${activeSessionId} introuvable. Veuillez créer la session d'abord.`);
        } else {
          toast.error(`Erreur: ${errorMsg}`);
        }
      } else {
        toast.error('Erreur lors du chargement des conversations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh messages function
  const refreshMessages = async () => {
    if (!activeSessionId || !selectedChat) return;

    setRefreshing(true);
    try {
      const response = await messageApi.getMessages(activeSessionId, selectedChat.id, 50);
      if (response.data.success) {
        setMessages(response.data.data);
        toast.success('Messages actualisés!');
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setRefreshing(false);
    }
  };

  const loadMessages = async (chat: Chat) => {
    if (!activeSessionId) return;

    setSelectedChat(chat);
    setIsLoading(true);

    try {
      const response = await messageApi.getMessages(activeSessionId, chat.id, 50);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeSessionId || !selectedChat || !messageText.trim()) return;

    setSending(true);
    try {
      const response = await sendMediaApi.post('/send-text', {
        sessionId: activeSessionId,
        to: selectedChat.id,
        message: messageText,
      });
      if (response.data.success) {
        const newMessage: Message = {
          id: response.data.data.id,
          body: messageText,
          from: 'me',
          to: selectedChat.id,
          timestamp: Math.floor(Date.now() / 1000),
          fromMe: true,
          type: 'text',
        };
        addMessage(newMessage);
        setMessageText('');
        toast.success('Message envoyé!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!activeSessionId || !selectedChat) return;
    if (uploadMode === 'url' && !imageUrl.trim()) return;
    if (uploadMode === 'file' && !imageFile) return;

    setSending(true);
    try {
      let response;
      if (uploadMode === 'file' && imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('sessionId', activeSessionId);
        formData.append('to', selectedChat.id);
        formData.append('caption', imageCaption);
        response = await axios.post(`${API_URL}/api/debug/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-API-Key': API_KEY },
        });
      } else {
        response = await sendMediaApi.post('/send-image', {
          sessionId: activeSessionId,
          to: selectedChat.id,
          imageUrl: imageUrl,
          caption: imageCaption,
        });
      }
      if (response.data.success) {
        const newMessage: Message = {
          id: response.data.data.id,
          body: imageCaption || '📷 Image',
          from: 'me',
          to: selectedChat.id,
          timestamp: Math.floor(Date.now() / 1000),
          fromMe: true,
          type: 'image',
          mediaUrl: uploadMode === 'file' && imageFile ? URL.createObjectURL(imageFile) : imageUrl,
        };
        addMessage(newMessage);
        setImageUrl('');
        setImageCaption('');
        setImageFile(null);
        setImageDialogOpen(false);
        toast.success('Image envoyée!');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi de l\'image');
    } finally {
      setSending(false);
    }
  };

  const handleSendDocument = async () => {
    if (!activeSessionId || !selectedChat) return;
    if (uploadMode === 'url' && !documentUrl.trim()) return;
    if (uploadMode === 'file' && !documentFile) return;

    setSending(true);
    try {
      let response;
      const filename = documentName || (documentFile?.name) || 'document';
      if (uploadMode === 'file' && documentFile) {
        const formData = new FormData();
        formData.append('document', documentFile);
        formData.append('sessionId', activeSessionId);
        formData.append('to', selectedChat.id);
        formData.append('filename', filename);
        response = await axios.post(`${API_URL}/api/debug/upload-document`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-API-Key': API_KEY },
        });
      } else {
        response = await sendMediaApi.post('/send-document', {
          sessionId: activeSessionId,
          to: selectedChat.id,
          documentUrl: documentUrl,
          filename: filename,
        });
      }
      if (response.data.success) {
        const newMessage: Message = {
          id: response.data.data.id,
          body: `📄 ${filename}`,
          from: 'me',
          to: selectedChat.id,
          timestamp: Math.floor(Date.now() / 1000),
          fromMe: true,
          type: 'document',
        };
        addMessage(newMessage);
        setDocumentUrl('');
        setDocumentName('');
        setDocumentFile(null);
        setDocumentDialogOpen(false);
        toast.success('Document envoyé!');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi du document');
    } finally {
      setSending(false);
    }
  };

  const handleSendLocation = async () => {
    if (!activeSessionId || !selectedChat || !latitude.trim() || !longitude.trim()) return;

    setSending(true);
    try {
      const response = await sendMediaApi.post('/send-location', {
        sessionId: activeSessionId,
        to: selectedChat.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: locationDesc,
      });
      if (response.data.success) {
        const newMessage: Message = {
          id: response.data.data.id,
          body: `📍 ${locationDesc || 'Localisation'}`,
          from: 'me',
          to: selectedChat.id,
          timestamp: Math.floor(Date.now() / 1000),
          fromMe: true,
          type: 'location',
        };
        addMessage(newMessage);
        setLatitude('');
        setLongitude('');
        setLocationDesc('');
        setLocationDialogOpen(false);
        toast.success('Localisation envoyée!');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi de la localisation');
    } finally {
      setSending(false);
    }
  };

  const handleSendAttachment = async () => {
    if (!activeSessionId || !selectedChat) return;
    if (uploadMode === 'url' && !attachmentUrl.trim()) return;
    if (uploadMode === 'file' && !attachmentFile) return;

    setSending(true);
    try {
      let response;
      if (uploadMode === 'file' && attachmentFile) {
        const formData = new FormData();
        const fieldName = attachmentType === 'video' ? 'video' : 'audio';
        formData.append(fieldName, attachmentFile);
        formData.append('sessionId', activeSessionId);
        formData.append('to', selectedChat.id);
        if (attachmentType === 'video') {
          formData.append('caption', attachmentCaption);
        } else {
          formData.append('ptt', 'false');
        }
        const endpoint = attachmentType === 'video' ? '/upload-video' : '/upload-audio';
        response = await axios.post(`${API_URL}/api/debug${endpoint}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-API-Key': API_KEY },
        });
      } else {
        const endpoint = attachmentType === 'video' ? '/send-video' : '/send-audio';
        const payload = attachmentType === 'video' 
          ? { sessionId: activeSessionId, to: selectedChat.id, videoUrl: attachmentUrl, caption: attachmentCaption }
          : { sessionId: activeSessionId, to: selectedChat.id, audioUrl: attachmentUrl, ptt: false };
        response = await sendMediaApi.post(endpoint, payload);
      }
      if (response.data.success) {
        const newMessage: Message = {
          id: response.data.data.id,
          body: attachmentType === 'video' ? `🎥 ${attachmentCaption || 'Vidéo'}` : '🎵 Audio',
          from: 'me',
          to: selectedChat.id,
          timestamp: Math.floor(Date.now() / 1000),
          fromMe: true,
          type: attachmentType,
          mediaUrl: uploadMode === 'file' && attachmentFile ? URL.createObjectURL(attachmentFile) : attachmentUrl,
        };
        addMessage(newMessage);
        setAttachmentUrl('');
        setAttachmentCaption('');
        setAttachmentFile(null);
        setAttachmentDialogOpen(false);
        toast.success(`${attachmentType === 'video' ? 'Vidéo' : 'Audio'} envoyé!`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          toast.success('Position récupérée!');
        },
        () => {
          toast.error('Impossible de récupérer la position');
        }
      );
    } else {
      toast.error('Géolocalisation non supportée');
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'HH:mm', { locale: fr });
  };

  const formatChatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return format(date, 'HH:mm', { locale: fr });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return format(date, 'dd/MM/yy', { locale: fr });
    }
  };

  if (!activeSessionId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            Sélectionnez une session WhatsApp pour voir les conversations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Chat List */}
        <Card className="w-96 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {isLoading && chats.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune conversation
                </div>
              ) : (
                <div className="divide-y">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => loadMessages(chat)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          {chat.avatar ? (
                            <AvatarImage src={chat.avatar} />
                          ) : null}
                          <AvatarFallback>
                            {chat.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{chat.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {chat.timestamp ? formatChatDate(chat.timestamp) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.lastMessage || 'Aucun message'}
                            </p>
                            {chat.unreadCount > 0 && (
                              <Badge className="ml-2 bg-green-500">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {selectedChat.avatar ? (
                        <AvatarImage src={selectedChat.avatar} />
                      ) : null}
                      <AvatarFallback>
                        {selectedChat.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedChat.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedChat.id}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshMessages}
                    disabled={refreshing}
                    title="Actualiser les messages"
                  >
                    <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} formatTime={formatMessageTime} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setAttachmentDialogOpen(true)}
                    title="Pièce jointe (Vidéo/Audio)"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setImageDialogOpen(true)}
                    title="Envoyer une image"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDocumentDialogOpen(true)}
                    title="Envoyer un document"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setLocationDialogOpen(true)}
                    title="Envoyer une localisation"
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Tapez votre message..."
                    className="flex-1"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !messageText.trim()}>
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Sélectionnez une conversation</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={(open) => {
        setImageDialogOpen(open);
        if (!open) { setImageFile(null); setImageUrl(''); setUploadMode('url'); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📷 Envoyer une image</DialogTitle>
            <DialogDescription>
              Choisissez un fichier ou entrez une URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Toggle URL / File */}
            <div className="flex gap-2">
              <Button
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setUploadMode('url')}
              >
                🔗 URL
              </Button>
              <Button
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setUploadMode('file')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Fichier
              </Button>
            </div>

            {uploadMode === 'url' ? (
              <div>
                <Label>URL de l&apos;image *</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label>Sélectionner une image *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {imageFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Fichier: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Légende (optionnel)</Label>
              <Input
                placeholder="Description de l'image..."
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
            </div>

            {/* Preview */}
            {(imageUrl || imageFile) && (
              <div className="border rounded-lg p-2">
                <img 
                  src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} 
                  alt="Aperçu" 
                  className="max-h-48 mx-auto rounded"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendImage} 
              disabled={sending || (uploadMode === 'url' ? !imageUrl.trim() : !imageFile)}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={(open) => {
        setDocumentDialogOpen(open);
        if (!open) { setDocumentFile(null); setDocumentUrl(''); setUploadMode('url'); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📄 Envoyer un document</DialogTitle>
            <DialogDescription>
              Choisissez un fichier ou entrez une URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Toggle URL / File */}
            <div className="flex gap-2">
              <Button
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setUploadMode('url')}
              >
                🔗 URL
              </Button>
              <Button
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setUploadMode('file')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Fichier
              </Button>
            </div>

            {uploadMode === 'url' ? (
              <div>
                <Label>URL du document *</Label>
                <Input
                  placeholder="https://example.com/document.pdf"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label>Sélectionner un document *</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
                  ref={documentInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDocumentFile(file);
                    if (file && !documentName) setDocumentName(file.name);
                  }}
                />
                {documentFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Fichier: {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Nom du fichier</Label>
              <Input
                placeholder="document.pdf"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendDocument} 
              disabled={sending || (uploadMode === 'url' ? !documentUrl.trim() : !documentFile)}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📍 Envoyer une localisation</DialogTitle>
            <DialogDescription>
              Entrez les coordonnées ou utilisez votre position actuelle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button variant="outline" className="w-full" onClick={getCurrentLocation}>
              <MapPin className="h-4 w-4 mr-2" />
              Utiliser ma position actuelle
            </Button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude *</Label>
                <Input
                  placeholder="48.8566"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input
                  placeholder="2.3522"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Input
                placeholder="Paris, France"
                value={locationDesc}
                onChange={(e) => setLocationDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendLocation} disabled={sending || !latitude.trim() || !longitude.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog (Video/Audio) */}
      <Dialog open={attachmentDialogOpen} onOpenChange={(open) => {
        setAttachmentDialogOpen(open);
        if (!open) { setAttachmentFile(null); setAttachmentUrl(''); setUploadMode('url'); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📎 Envoyer une pièce jointe</DialogTitle>
            <DialogDescription>
              Envoyez une vidéo ou un fichier audio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Media type selector */}
            <div className="flex gap-2">
              <Button
                variant={attachmentType === 'video' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setAttachmentType('video'); setAttachmentFile(null); }}
              >
                <Video className="h-4 w-4 mr-2" />
                Vidéo
              </Button>
              <Button
                variant={attachmentType === 'audio' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => { setAttachmentType('audio'); setAttachmentFile(null); }}
              >
                <FileAudio className="h-4 w-4 mr-2" />
                Audio
              </Button>
            </div>

            {/* Toggle URL / File */}
            <div className="flex gap-2">
              <Button
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                className="flex-1"
                size="sm"
                onClick={() => setUploadMode('url')}
              >
                🔗 URL
              </Button>
              <Button
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                className="flex-1"
                size="sm"
                onClick={() => setUploadMode('file')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Fichier
              </Button>
            </div>

            {uploadMode === 'url' ? (
              <div>
                <Label>URL du fichier *</Label>
                <Input
                  placeholder={attachmentType === 'video' 
                    ? "https://example.com/video.mp4" 
                    : "https://example.com/audio.mp3"}
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label>Sélectionner un fichier *</Label>
                <Input
                  type="file"
                  accept={attachmentType === 'video' ? 'video/*' : 'audio/*'}
                  ref={attachmentInputRef}
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                />
                {attachmentFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Fichier: {attachmentFile.name} ({(attachmentFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            {attachmentType === 'video' && (
              <div>
                <Label>Légende (optionnel)</Label>
                <Input
                  placeholder="Description de la vidéo..."
                  value={attachmentCaption}
                  onChange={(e) => setAttachmentCaption(e.target.value)}
                />
              </div>
            )}

            {/* Preview */}
            {uploadMode === 'file' && attachmentFile && (
              <div className="border rounded-lg p-2">
                {attachmentType === 'video' ? (
                  <video 
                    src={URL.createObjectURL(attachmentFile)} 
                    controls 
                    className="max-h-48 mx-auto rounded"
                  />
                ) : (
                  <audio 
                    src={URL.createObjectURL(attachmentFile)} 
                    controls 
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachmentDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendAttachment} 
              disabled={sending || (uploadMode === 'url' ? !attachmentUrl.trim() : !attachmentFile)}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Message Bubble Component with media support
function MessageBubble({
  message,
  formatTime,
}: {
  message: Message;
  formatTime: (ts: number) => string;
}) {
  const isFromMe = message.fromMe;

  const renderMedia = () => {
    switch (message.type) {
      case 'image':
        return message.mediaUrl ? (
          <div className="mb-2">
            <img
              src={message.mediaUrl}
              alt="Image"
              className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
            <ImageIcon className="h-4 w-4" />
            <span>📷 Image</span>
          </div>
        );

      case 'video':
        return message.mediaUrl ? (
          <div className="mb-2">
            <video
              src={message.mediaUrl}
              controls
              className="rounded-lg max-w-full max-h-64"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
            <Video className="h-4 w-4" />
            <span>🎥 Vidéo</span>
          </div>
        );

      case 'audio':
      case 'ptt':
        return message.mediaUrl ? (
          <div className="mb-2">
            <audio src={message.mediaUrl} controls className="w-full" />
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
            <FileAudio className="h-4 w-4" />
            <span>🎵 Audio</span>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-2 mb-2 p-2 bg-background/20 rounded">
            <File className="h-8 w-8" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.body || 'Document'}
              </p>
            </div>
            {message.mediaUrl && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => window.open(message.mediaUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span>📍 Localisation partagée</span>
          </div>
        );

      case 'sticker':
        return message.mediaUrl ? (
          <div className="mb-2">
            <img
              src={message.mediaUrl}
              alt="Sticker"
              className="max-w-32 max-h-32"
            />
          </div>
        ) : (
          <span className="text-2xl">🎨</span>
        );

      default:
        return null;
    }
  };

  // Ne pas afficher le body si c'est vide et qu'il n'y a pas de média
  const hasContent = message.body || message.mediaUrl || ['image', 'video', 'audio', 'ptt', 'document', 'location', 'sticker'].includes(message.type);
  
  if (!hasContent) return null;

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isFromMe
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {renderMedia()}
        {message.body && message.type !== 'document' && (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        )}
        <p
          className={`text-xs mt-1 ${
            isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
