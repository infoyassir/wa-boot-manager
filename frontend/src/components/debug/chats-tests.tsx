'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  VolumeX,
  Volume2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Clock,
  Users,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { chatsApi } from '@/lib/debug-api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: Date;
}

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  isReadOnly: boolean;
  isMuted: boolean;
  unreadCount: number;
  timestamp: number;
  lastMessage?: {
    body: string;
    fromMe: boolean;
  };
}

interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  hasMedia: boolean;
}

interface Props {
  sessionId: string;
}

export function ChatsTests({ sessionId }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string>('');

  // Form states
  const [chatId, setChatId] = useState('');
  const [muteDuration, setMuteDuration] = useState('8');
  const [messageLimit, setMessageLimit] = useState('20');

  const addResult = (result: TestResult) => {
    setResults((prev) => [result, ...prev].slice(0, 20));
  };

  const runTest = async (name: string, testFn: () => Promise<unknown>) => {
    setLoading(name);
    try {
      const response = await testFn();
      addResult({
        name,
        success: true,
        message: 'Test passed successfully',
        data: response,
        timestamp: new Date(),
      });
      toast.success(`${name}: Test réussi!`);
      return response;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      addResult({
        name,
        success: false,
        message: err.response?.data?.error || err.message || 'Unknown error',
        timestamp: new Date(),
      });
      toast.error(`${name}: ${err.response?.data?.error || err.message}`);
      throw error;
    } finally {
      setLoading(null);
    }
  };

  const handleGetChats = async () => {
    try {
      const response = await runTest('Get All Chats', () => chatsApi.getAll(sessionId));
      if ((response as { success: boolean; chats: Chat[] }).success) {
        setChats((response as { chats: Chat[] }).chats);
      }
    } catch (e) {
      // Error handled in runTest
    }
  };

  const handleMuteChat = async () => {
    await runTest('Mute Chat', () => chatsApi.mute(sessionId, chatId, parseInt(muteDuration) * 3600000));
  };

  const handleUnmuteChat = async () => {
    await runTest('Unmute Chat', () => chatsApi.unmute(sessionId, chatId));
  };

  const handleGetMessages = async () => {
    try {
      const response = await runTest('Get Messages', () => 
        chatsApi.getMessages(sessionId, chatId, parseInt(messageLimit))
      );
      if ((response as { success: boolean; messages: Message[] }).success) {
        setMessages((response as { messages: Message[] }).messages);
      }
    } catch (e) {
      setMessages([]);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const ChatCard = ({ chat }: { chat: Chat }) => (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
        selectedChat === chat.id ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={() => {
        setSelectedChat(chat.id);
        setChatId(chat.id);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${chat.isGroup ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
          {chat.isGroup ? (
            <Users className="h-4 w-4 text-blue-500" />
          ) : (
            <User className="h-4 w-4 text-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm truncate">{chat.name}</h4>
            {chat.unreadCount > 0 && (
              <Badge variant="default" className="ml-2">{chat.unreadCount}</Badge>
            )}
          </div>
          {chat.lastMessage && (
            <p className="text-xs text-muted-foreground truncate">
              {chat.lastMessage.fromMe ? 'Vous: ' : ''}
              {chat.lastMessage.body}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {chat.isMuted && (
              <Badge variant="outline" className="text-xs">
                <VolumeX className="h-3 w-3 mr-1" />
                Muted
              </Badge>
            )}
            {chat.isReadOnly && (
              <Badge variant="outline" className="text-xs">Read-only</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Chat ID Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Configuration du Chat
            </CardTitle>
            <CardDescription>
              Sélectionnez un chat dans la liste ou entrez l'ID manuellement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Chat ID</Label>
                <Input
                  placeholder="33612345678@c.us ou 1234567890@g.us"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Get All Chats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Get All Chats
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer la liste de tous les chats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Récupère tous les chats (conversations et groupes) de la session.
              </p>
              <Button
                onClick={handleGetChats}
                disabled={loading === 'Get All Chats'}
                className="w-full"
              >
                {loading === 'Get All Chats' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Charger les chats
              </Button>
            </CardContent>
          </Card>

          {/* Get Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Get Messages
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer les messages d'un chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre de messages</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={messageLimit}
                  onChange={(e) => setMessageLimit(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGetMessages}
                disabled={loading === 'Get Messages' || !chatId}
                className="w-full"
              >
                {loading === 'Get Messages' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Charger les messages
              </Button>
            </CardContent>
          </Card>

          {/* Mute Chat */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <VolumeX className="h-5 w-5 text-orange-500" />
                Mute Chat
              </CardTitle>
              <CardDescription className="text-sm">
                Mettre un chat en sourdine
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Durée (heures)</Label>
                <Input
                  type="number"
                  min="1"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(e.target.value)}
                />
              </div>
              <Button
                onClick={handleMuteChat}
                disabled={loading === 'Mute Chat' || !chatId}
                variant="outline"
                className="w-full"
              >
                {loading === 'Mute Chat' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <VolumeX className="h-4 w-4 mr-2" />
                )}
                Mettre en sourdine
              </Button>
            </CardContent>
          </Card>

          {/* Unmute Chat */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-green-500" />
                Unmute Chat
              </CardTitle>
              <CardDescription className="text-sm">
                Réactiver les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Réactive les notifications pour ce chat.
              </p>
              <Button
                onClick={handleUnmuteChat}
                disabled={loading === 'Unmute Chat' || !chatId}
                className="w-full"
              >
                {loading === 'Unmute Chat' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-2" />
                )}
                Réactiver
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chats List */}
        {chats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Liste des Chats ({chats.length})</CardTitle>
              <CardDescription>Cliquez sur un chat pour le sélectionner</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <ChatCard key={chat.id} chat={chat} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Messages List */}
        {messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages ({messages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.fromMe
                          ? 'bg-primary/10 ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{msg.body || '[Media]'}</p>
                      {msg.hasMedia && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Contient un média
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 font-mono truncate">
                        ID: {msg.id}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Panel */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-base">Résultats des Tests</CardTitle>
            <CardDescription>Historique des tests exécutés</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun test exécuté
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium text-sm">{result.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
