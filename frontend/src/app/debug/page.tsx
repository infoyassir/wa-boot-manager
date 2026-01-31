'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Image as ImageIcon,
  FileAudio,
  Video,
  FileText,
  Sticker,
  MapPin,
  Contact,
  Reply,
  Heart,
  BarChart3,
  AtSign,
  Users,
  Link2,
  UserPlus,
  UserMinus,
  Shield,
  ShieldOff,
  Settings2,
  Info,
  ImageIcon as ProfileIcon,
  Ban,
  BellOff,
  Bell,
  Radio,
  User,
  Bug,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

// Import test components
import { MessagingTests, ContactsTests, GroupsTests, ChatsTests, StatusTests } from '@/components/debug';

const FEATURES = [
  { name: 'Multi Device', status: 'supported', icon: Users },
  { name: 'Send messages', status: 'supported', icon: MessageSquare },
  { name: 'Receive messages', status: 'supported', icon: MessageSquare },
  { name: 'Send media (images/audio/documents)', status: 'supported', icon: ImageIcon },
  { name: 'Send media (video)', status: 'supported', icon: Video },
  { name: 'Send stickers', status: 'supported', icon: Sticker },
  { name: 'Receive media', status: 'supported', icon: FileText },
  { name: 'Send contact cards', status: 'supported', icon: Contact },
  { name: 'Send location', status: 'supported', icon: MapPin },
  { name: 'Send buttons', status: 'deprecated', icon: Settings2 },
  { name: 'Send lists', status: 'deprecated', icon: Settings2 },
  { name: 'Receive location', status: 'supported', icon: MapPin },
  { name: 'Message replies', status: 'supported', icon: Reply },
  { name: 'Join groups by invite', status: 'supported', icon: UserPlus },
  { name: 'Get invite for group', status: 'supported', icon: Link2 },
  { name: 'Modify group info', status: 'supported', icon: Info },
  { name: 'Modify group settings', status: 'supported', icon: Settings2 },
  { name: 'Add group participants', status: 'supported', icon: UserPlus },
  { name: 'Kick group participants', status: 'supported', icon: UserMinus },
  { name: 'Promote/demote participants', status: 'supported', icon: Shield },
  { name: 'Mention users', status: 'supported', icon: AtSign },
  { name: 'Mention groups', status: 'supported', icon: AtSign },
  { name: 'Mute/unmute chats', status: 'supported', icon: BellOff },
  { name: 'Block/unblock contacts', status: 'supported', icon: Ban },
  { name: 'Get contact info', status: 'supported', icon: Info },
  { name: 'Get profile pictures', status: 'supported', icon: ProfileIcon },
  { name: 'Set user status message', status: 'supported', icon: User },
  { name: 'React to messages', status: 'supported', icon: Heart },
  { name: 'Create polls', status: 'supported', icon: BarChart3 },
  { name: 'Channels', status: 'supported', icon: Radio },
];

export default function DebugPage() {
  const { activeSessionId, sessions } = useAppStore();
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bug className="h-8 w-8 text-orange-500" />
            Debug & Test Center
          </h1>
          <p className="text-muted-foreground">
            Testez toutes les fonctionnalités de whatsapp-web.js
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession ? (
            <Badge className="bg-green-500/10 text-green-600 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Session: {activeSession.info?.pushname || activeSessionId}
            </Badge>
          ) : (
            <Badge variant="destructive" className="px-4 py-2">
              <XCircle className="h-4 w-4 mr-2" />
              Aucune session active
            </Badge>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fonctionnalités Supportées</CardTitle>
          <CardDescription>
            Liste complète des fonctionnalités whatsapp-web.js v1.34.6
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.name}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  feature.status === 'supported'
                    ? 'bg-green-500/10 text-green-700'
                    : 'bg-red-500/10 text-red-700'
                }`}
              >
                <feature.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{feature.name}</span>
                {feature.status === 'deprecated' && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    DEP
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Tabs */}
      {!activeSessionId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bug className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">Session requise</h3>
            <p className="text-muted-foreground">
              Veuillez créer et connecter une session WhatsApp pour commencer les tests
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="messaging" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groupes
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messaging">
            <MessagingTests sessionId={activeSessionId} />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsTests sessionId={activeSessionId} />
          </TabsContent>

          <TabsContent value="groups">
            <GroupsTests sessionId={activeSessionId} />
          </TabsContent>

          <TabsContent value="chats">
            <ChatsTests sessionId={activeSessionId} />
          </TabsContent>

          <TabsContent value="status">
            <StatusTests sessionId={activeSessionId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
