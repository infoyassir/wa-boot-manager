'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Radio,
  Rss,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Info,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { statusApi, channelsApi } from '@/lib/debug-api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: Date;
}

interface MyInfo {
  id: string;
  name: string;
  pushname?: string;
  platform?: string;
  profilePicUrl?: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  subscriberCount?: number;
}

interface Props {
  sessionId: string;
}

export function StatusTests({ sessionId }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Form states
  const [statusMessage, setStatusMessage] = useState('Testing WhatsApp Bot Manager! 🤖');

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

  const handleSetStatus = async () => {
    await runTest('Set Status', () => statusApi.set(sessionId, statusMessage));
  };

  const handleGetMyInfo = async () => {
    try {
      const response = await runTest('Get My Info', () => statusApi.getMe(sessionId));
      if ((response as { success: boolean; info: MyInfo }).success) {
        setMyInfo((response as { info: MyInfo }).info);
      }
    } catch (e) {
      setMyInfo(null);
    }
  };

  const handleGetChannels = async () => {
    try {
      const response = await runTest('Get Channels', () => channelsApi.getAll(sessionId));
      if ((response as { success: boolean; channels: Channel[] }).success) {
        setChannels((response as { channels: Channel[] }).channels);
      }
    } catch (e) {
      setChannels([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status & Profile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Set Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Set Status
              </CardTitle>
              <CardDescription className="text-sm">
                Définir votre message de statut (About)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Message de statut</Label>
                <Textarea
                  placeholder="Votre statut..."
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max 139 caractères
                </p>
              </div>
              <Button
                onClick={handleSetStatus}
                disabled={loading === 'Set Status' || !statusMessage}
                className="w-full"
              >
                {loading === 'Set Status' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4 mr-2" />
                )}
                Définir le statut
              </Button>
            </CardContent>
          </Card>

          {/* Get My Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Get My Info
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer mes informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Récupère les informations du compte WhatsApp connecté.
              </p>
              <Button
                onClick={handleGetMyInfo}
                disabled={loading === 'Get My Info'}
                className="w-full"
              >
                {loading === 'Get My Info' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Info className="h-4 w-4 mr-2" />
                )}
                Récupérer mes infos
              </Button>
            </CardContent>
          </Card>

          {/* Get Channels */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Rss className="h-5 w-5 text-primary" />
                Get Channels
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer la liste des chaînes WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Les chaînes WhatsApp (Channels) permettent de diffuser des messages à grande échelle.
                Cette fonctionnalité est relativement nouvelle.
              </p>
              <Button
                onClick={handleGetChannels}
                disabled={loading === 'Get Channels'}
                className="w-full"
              >
                {loading === 'Get Channels' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Rss className="h-4 w-4 mr-2" />
                )}
                Charger les chaînes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Info Display */}
        {myInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mon Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  {myInfo.profilePicUrl ? (
                    <AvatarImage src={myInfo.profilePicUrl} alt={myInfo.name} />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {(myInfo.name || myInfo.pushname || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {myInfo.name || myInfo.pushname || 'Unknown'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{myInfo.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {myInfo.platform && (
                      <Badge variant="secondary">{myInfo.platform}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(myInfo, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Channels List */}
        {channels.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chaînes WhatsApp ({channels.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="p-3 rounded-lg border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Hash className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{channel.name}</h4>
                          {channel.description && (
                            <p className="text-sm text-muted-foreground">
                              {channel.description}
                            </p>
                          )}
                          {channel.subscriberCount !== undefined && (
                            <Badge variant="outline" className="mt-2">
                              {channel.subscriberCount.toLocaleString()} abonnés
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Feature Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Fonctionnalités Supportées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Définir le message de statut (About)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Récupérer les informations du profil
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Lister les chaînes WhatsApp
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-500" />
                Limitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  Statut limité à 139 caractères
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  Les chaînes sont une fonctionnalité récente
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  Certaines fonctionnalités nécessitent WhatsApp Business
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
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
