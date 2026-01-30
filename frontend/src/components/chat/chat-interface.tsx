'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { messageApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  MapPin,
  Loader2,
  Search,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Chat, Message } from '@/store/app-store';

export function ChatInterface() {
  const { activeSessionId, chats, setChats, messages, setMessages, addMessage } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setIsLoading(false);
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
      await messageApi.sendText(activeSessionId, selectedChat.id, messageText);
      setMessageText('');
      // Message will be added via socket event
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
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
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <FileText className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
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
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  formatTime,
}: {
  message: Message;
  formatTime: (ts: number) => string;
}) {
  const isFromMe = message.fromMe;

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isFromMe
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {message.type === 'image' && message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="Image"
            className="rounded-lg max-w-full mb-2"
          />
        )}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
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
