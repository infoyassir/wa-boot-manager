'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Image as ImageIcon,
  Ban,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  UserCheck,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { contactsApi } from '@/lib/debug-api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: Date;
}

interface ContactInfo {
  id: string;
  name: string;
  pushname?: string;
  isBlocked?: boolean;
  isBusiness?: boolean;
  isEnterprise?: boolean;
  isGroup?: boolean;
  isMyContact?: boolean;
  isUser?: boolean;
  isWAContact?: boolean;
  number?: string;
  shortName?: string;
}

interface Props {
  sessionId: string;
}

export function ContactsTests({ sessionId }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Form states
  const [contactId, setContactId] = useState('');

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

  const handleGetContactInfo = async () => {
    try {
      const response = await runTest('Get Contact Info', () => contactsApi.getInfo(sessionId, contactId));
      if ((response as { success: boolean; contact: ContactInfo }).success) {
        setContactInfo((response as { contact: ContactInfo }).contact);
      }
    } catch (e) {
      setContactInfo(null);
    }
  };

  const handleGetProfilePic = async () => {
    try {
      const response = await runTest('Get Profile Picture', () => contactsApi.getProfilePicture(sessionId, contactId));
      if ((response as { success: boolean; url: string }).success) {
        setProfilePic((response as { url: string }).url);
      }
    } catch (e) {
      setProfilePic(null);
    }
  };

  const handleBlockContact = async () => {
    await runTest('Block Contact', () => contactsApi.block(sessionId, contactId));
  };

  const handleUnblockContact = async () => {
    await runTest('Unblock Contact', () => contactsApi.unblock(sessionId, contactId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Forms */}
      <div className="lg:col-span-2 space-y-6">
        {/* Contact ID Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contact Configuration
            </CardTitle>
            <CardDescription>
              Entrez le numéro de téléphone du contact à tester
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Numéro de téléphone</Label>
                <Input
                  placeholder="33612345678"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: code pays + numéro (sans + ni espaces)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Get Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Get Contact Info
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer les informations d'un contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Récupère les informations complètes du contact: nom, numéro, statut business, etc.
              </p>
              <Button
                onClick={handleGetContactInfo}
                disabled={loading === 'Get Contact Info' || !contactId}
                className="w-full"
              >
                {loading === 'Get Contact Info' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Récupérer les infos
              </Button>
            </CardContent>
          </Card>

          {/* Get Profile Picture */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Get Profile Picture
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer la photo de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Télécharge la photo de profil du contact si elle est disponible.
              </p>
              <Button
                onClick={handleGetProfilePic}
                disabled={loading === 'Get Profile Picture' || !contactId}
                className="w-full"
              >
                {loading === 'Get Profile Picture' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Récupérer la photo
              </Button>
            </CardContent>
          </Card>

          {/* Block Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Block Contact
              </CardTitle>
              <CardDescription className="text-sm">
                Bloquer un contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Le contact ne pourra plus vous envoyer de messages ni voir vos statuts.
              </p>
              <Button
                onClick={handleBlockContact}
                disabled={loading === 'Block Contact' || !contactId}
                variant="destructive"
                className="w-full"
              >
                {loading === 'Block Contact' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                Bloquer
              </Button>
            </CardContent>
          </Card>

          {/* Unblock Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                Unblock Contact
              </CardTitle>
              <CardDescription className="text-sm">
                Débloquer un contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Le contact pourra à nouveau vous envoyer des messages.
              </p>
              <Button
                onClick={handleUnblockContact}
                disabled={loading === 'Unblock Contact' || !contactId}
                className="w-full"
              >
                {loading === 'Unblock Contact' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-2" />
                )}
                Débloquer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info Display */}
        {contactInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations du Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  {profilePic ? (
                    <AvatarImage src={profilePic} alt={contactInfo.name} />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {(contactInfo.name || contactInfo.pushname || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {contactInfo.name || contactInfo.pushname || 'Unknown'}
                    </h3>
                    {contactInfo.number && (
                      <p className="text-sm text-muted-foreground">+{contactInfo.number}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contactInfo.isBlocked && (
                      <Badge variant="destructive">Bloqué</Badge>
                    )}
                    {contactInfo.isBusiness && (
                      <Badge variant="secondary">Business</Badge>
                    )}
                    {contactInfo.isEnterprise && (
                      <Badge variant="secondary">Enterprise</Badge>
                    )}
                    {contactInfo.isMyContact && (
                      <Badge variant="outline">Dans mes contacts</Badge>
                    )}
                    {contactInfo.isWAContact && (
                      <Badge variant="outline">WhatsApp</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(contactInfo, null, 2)}
                </pre>
              </div>
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
