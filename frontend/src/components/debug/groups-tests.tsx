'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Link2,
  LogIn,
  LogOut,
  Info,
  Edit,
  UserPlus,
  UserMinus,
  Shield,
  ShieldOff,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Crown,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { groupsApi } from '@/lib/debug-api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: Date;
}

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  participants?: Array<{
    id: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>;
  createdAt?: number;
}

interface Props {
  sessionId: string;
}

export function GroupsTests({ sessionId }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Form states
  const [groupName, setGroupName] = useState('Test Group');
  const [participants, setParticipants] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [groupId, setGroupId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [participantToAdd, setParticipantToAdd] = useState('');
  const [participantToRemove, setParticipantToRemove] = useState('');
  const [participantToPromote, setParticipantToPromote] = useState('');
  const [participantToDemote, setParticipantToDemote] = useState('');
  const [messagesAdminsOnly, setMessagesAdminsOnly] = useState(false);
  const [editInfoAdminsOnly, setEditInfoAdminsOnly] = useState(false);

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

  const handleCreateGroup = async () => {
    const participantList = participants.split(',').map(p => p.trim()).filter(Boolean);
    if (participantList.length === 0) {
      toast.error('Ajoutez au moins un participant');
      return;
    }
    try {
      const response = await runTest('Create Group', () => 
        groupsApi.create(sessionId, groupName, participantList)
      );
      if ((response as { success: boolean; groupId: string }).success) {
        setGroupId((response as { groupId: string }).groupId);
      }
    } catch (e) {
      // Error handled in runTest
    }
  };

  const handleGetInviteCode = async () => {
    try {
      const response = await runTest('Get Invite Code', () => 
        groupsApi.getInvite(sessionId, groupId)
      );
      if ((response as { success: boolean; inviteCode: string }).success) {
        setInviteCode((response as { inviteCode: string }).inviteCode);
      }
    } catch (e) {
      // Error handled in runTest
    }
  };

  const handleJoinGroup = async () => {
    await runTest('Join Group', () => groupsApi.join(sessionId, inviteCodeInput));
  };

  const handleLeaveGroup = async () => {
    await runTest('Leave Group', () => groupsApi.leave(sessionId, groupId));
  };

  const handleGetGroupInfo = async () => {
    try {
      const response = await runTest('Get Group Info', () => 
        groupsApi.getInfo(sessionId, groupId)
      );
      if ((response as { success: boolean; group: GroupInfo }).success) {
        setGroupInfo((response as { group: GroupInfo }).group);
      }
    } catch (e) {
      setGroupInfo(null);
    }
  };

  const handleSetSubject = async () => {
    await runTest('Set Subject', () => groupsApi.setSubject(sessionId, groupId, newSubject));
  };

  const handleSetDescription = async () => {
    await runTest('Set Description', () => groupsApi.setDescription(sessionId, groupId, newDescription));
  };

  const handleAddParticipant = async () => {
    const ids = participantToAdd.split(',').map(p => p.trim()).filter(Boolean);
    await runTest('Add Participants', () => groupsApi.addParticipants(sessionId, groupId, ids));
  };

  const handleRemoveParticipant = async () => {
    const ids = participantToRemove.split(',').map(p => p.trim()).filter(Boolean);
    await runTest('Remove Participants', () => groupsApi.removeParticipants(sessionId, groupId, ids));
  };

  const handlePromoteParticipant = async () => {
    const ids = participantToPromote.split(',').map(p => p.trim()).filter(Boolean);
    await runTest('Promote Participants', () => groupsApi.promoteParticipants(sessionId, groupId, ids));
  };

  const handleDemoteParticipant = async () => {
    const ids = participantToDemote.split(',').map(p => p.trim()).filter(Boolean);
    await runTest('Demote Participants', () => groupsApi.demoteParticipants(sessionId, groupId, ids));
  };

  const handleSetSettings = async () => {
    await runTest('Set Group Settings', () => 
      groupsApi.setSettings(sessionId, groupId, messagesAdminsOnly, editInfoAdminsOnly)
    );
  };

  const copyInviteLink = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(`https://chat.whatsapp.com/${inviteCode}`);
      toast.success('Lien d\'invitation copié!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Forms */}
      <div className="lg:col-span-2 space-y-6">
        {/* Group ID Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Configuration du Groupe
            </CardTitle>
            <CardDescription>
              Entrez l'ID du groupe pour les tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label>Group ID</Label>
                <Input
                  placeholder="1234567890@g.us"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: numéros@g.us
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Group */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Create Group
              </CardTitle>
              <CardDescription className="text-sm">
                Créer un nouveau groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom du groupe</Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div>
                <Label>Participants (séparés par virgule)</Label>
                <Input
                  placeholder="33612345678, 33687654321"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={loading === 'Create Group' || !participants}
                className="w-full"
              >
                {loading === 'Create Group' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Créer le groupe
              </Button>
            </CardContent>
          </Card>

          {/* Get Invite Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Get Invite Code
              </CardTitle>
              <CardDescription className="text-sm">
                Obtenir le code d'invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteCode && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono truncate">{inviteCode}</span>
                    <Button size="icon" variant="ghost" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <Button
                onClick={handleGetInviteCode}
                disabled={loading === 'Get Invite Code' || !groupId}
                className="w-full"
              >
                {loading === 'Get Invite Code' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Obtenir le code
              </Button>
            </CardContent>
          </Card>

          {/* Join Group */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LogIn className="h-5 w-5 text-green-500" />
                Join Group
              </CardTitle>
              <CardDescription className="text-sm">
                Rejoindre un groupe via invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Code d'invitation</Label>
                <Input
                  placeholder="ABCDEfgh123"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                />
              </div>
              <Button
                onClick={handleJoinGroup}
                disabled={loading === 'Join Group' || !inviteCodeInput}
                className="w-full"
              >
                {loading === 'Join Group' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                Rejoindre
              </Button>
            </CardContent>
          </Card>

          {/* Leave Group */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LogOut className="h-5 w-5 text-red-500" />
                Leave Group
              </CardTitle>
              <CardDescription className="text-sm">
                Quitter un groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous quitterez le groupe sélectionné.
              </p>
              <Button
                onClick={handleLeaveGroup}
                disabled={loading === 'Leave Group' || !groupId}
                variant="destructive"
                className="w-full"
              >
                {loading === 'Leave Group' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Quitter
              </Button>
            </CardContent>
          </Card>

          {/* Get Group Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Get Group Info
              </CardTitle>
              <CardDescription className="text-sm">
                Récupérer les informations du groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGetGroupInfo}
                disabled={loading === 'Get Group Info' || !groupId}
                className="w-full"
              >
                {loading === 'Get Group Info' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Récupérer les infos
              </Button>
            </CardContent>
          </Card>

          {/* Set Subject */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Set Subject
              </CardTitle>
              <CardDescription className="text-sm">
                Modifier le nom du groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nouveau nom</Label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSetSubject}
                disabled={loading === 'Set Subject' || !groupId || !newSubject}
                className="w-full"
              >
                {loading === 'Set Subject' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Modifier
              </Button>
            </CardContent>
          </Card>

          {/* Set Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Set Description
              </CardTitle>
              <CardDescription className="text-sm">
                Modifier la description du groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nouvelle description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleSetDescription}
                disabled={loading === 'Set Description' || !groupId || !newDescription}
                className="w-full"
              >
                {loading === 'Set Description' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Modifier
              </Button>
            </CardContent>
          </Card>

          {/* Add Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-500" />
                Add Participants
              </CardTitle>
              <CardDescription className="text-sm">
                Ajouter des membres au groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Participants (séparés par virgule)</Label>
                <Input
                  placeholder="33612345678"
                  value={participantToAdd}
                  onChange={(e) => setParticipantToAdd(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddParticipant}
                disabled={loading === 'Add Participants' || !groupId || !participantToAdd}
                className="w-full"
              >
                {loading === 'Add Participants' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Ajouter
              </Button>
            </CardContent>
          </Card>

          {/* Remove Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-red-500" />
                Remove Participants
              </CardTitle>
              <CardDescription className="text-sm">
                Retirer des membres du groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Participants (séparés par virgule)</Label>
                <Input
                  placeholder="33612345678"
                  value={participantToRemove}
                  onChange={(e) => setParticipantToRemove(e.target.value)}
                />
              </div>
              <Button
                onClick={handleRemoveParticipant}
                disabled={loading === 'Remove Participants' || !groupId || !participantToRemove}
                variant="destructive"
                className="w-full"
              >
                {loading === 'Remove Participants' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4 mr-2" />
                )}
                Retirer
              </Button>
            </CardContent>
          </Card>

          {/* Promote Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Promote to Admin
              </CardTitle>
              <CardDescription className="text-sm">
                Promouvoir des membres en admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Participants (séparés par virgule)</Label>
                <Input
                  placeholder="33612345678"
                  value={participantToPromote}
                  onChange={(e) => setParticipantToPromote(e.target.value)}
                />
              </div>
              <Button
                onClick={handlePromoteParticipant}
                disabled={loading === 'Promote Participants' || !groupId || !participantToPromote}
                className="w-full"
              >
                {loading === 'Promote Participants' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                Promouvoir
              </Button>
            </CardContent>
          </Card>

          {/* Demote Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-orange-500" />
                Demote Admin
              </CardTitle>
              <CardDescription className="text-sm">
                Rétrograder des admins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Participants (séparés par virgule)</Label>
                <Input
                  placeholder="33612345678"
                  value={participantToDemote}
                  onChange={(e) => setParticipantToDemote(e.target.value)}
                />
              </div>
              <Button
                onClick={handleDemoteParticipant}
                disabled={loading === 'Demote Participants' || !groupId || !participantToDemote}
                variant="outline"
                className="w-full"
              >
                {loading === 'Demote Participants' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldOff className="h-4 w-4 mr-2" />
                )}
                Rétrograder
              </Button>
            </CardContent>
          </Card>

          {/* Group Settings */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Group Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Modifier les paramètres du groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Messages admins only</p>
                    <p className="text-xs text-muted-foreground">Seuls les admins peuvent envoyer des messages</p>
                  </div>
                  <Switch checked={messagesAdminsOnly} onCheckedChange={setMessagesAdminsOnly} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Edit info admins only</p>
                    <p className="text-xs text-muted-foreground">Seuls les admins peuvent modifier les infos</p>
                  </div>
                  <Switch checked={editInfoAdminsOnly} onCheckedChange={setEditInfoAdminsOnly} />
                </div>
              </div>
              <Button
                onClick={handleSetSettings}
                disabled={loading === 'Set Group Settings' || !groupId}
                className="w-full"
              >
                {loading === 'Set Group Settings' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Appliquer les paramètres
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Group Info Display */}
        {groupInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations du Groupe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{groupInfo.name}</h3>
                  {groupInfo.description && (
                    <p className="text-sm text-muted-foreground">{groupInfo.description}</p>
                  )}
                </div>
                {groupInfo.participants && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Participants ({groupInfo.participants.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {groupInfo.participants.slice(0, 10).map((p) => (
                        <Badge
                          key={p.id}
                          variant={p.isSuperAdmin ? 'default' : p.isAdmin ? 'secondary' : 'outline'}
                        >
                          {p.id.split('@')[0]}
                          {p.isSuperAdmin && <Crown className="h-3 w-3 ml-1" />}
                          {p.isAdmin && !p.isSuperAdmin && <Shield className="h-3 w-3 ml-1" />}
                        </Badge>
                      ))}
                      {groupInfo.participants.length > 10 && (
                        <Badge variant="outline">+{groupInfo.participants.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(groupInfo, null, 2)}
                  </pre>
                </div>
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
            <ScrollArea className="h-[600px]">
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
