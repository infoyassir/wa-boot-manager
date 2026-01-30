'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { sessionApi } from '@/lib/api';
import { getSocket, subscribeToSession } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  RefreshCw,
  Smartphone,
  QrCode,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export function SessionManager() {
  const { sessions, setSessions, setActiveSession, activeSessionId, removeSession } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();

    socket.on('session:qr', ({ sessionId, qr }) => {
      if (sessionId === pendingSessionId) {
        setQrCode(qr);
        setQrDialogOpen(true);
      }
    });

    socket.on('session:ready', ({ sessionId, info }) => {
      toast.success(`Session ${sessionId} connectée!`);
      setQrDialogOpen(false);
      setQrCode(null);
      loadSessions();
    });

    socket.on('session:disconnected', ({ sessionId }) => {
      toast.warning(`Session ${sessionId} déconnectée`);
      loadSessions();
    });
  };

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await sessionApi.list();
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionId.trim()) {
      toast.error('Veuillez entrer un ID de session');
      return;
    }

    setIsLoading(true);
    try {
      const response = await sessionApi.create(newSessionId.trim());
      if (response.data.success) {
        setPendingSessionId(newSessionId.trim());
        setCreateDialogOpen(false);
        setNewSessionId('');
        toast.success('Session créée, attendez le QR code...');
        
        // Subscribe to session events
        subscribeToSession(newSessionId.trim());
        
        // Poll for QR code
        pollForQR(newSessionId.trim());
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const pollForQR = async (sessionId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast.error('Timeout: QR code non reçu');
        return;
      }

      try {
        const response = await sessionApi.getQR(sessionId);
        if (response.data.success && response.data.data.qr) {
          setQrCode(response.data.data.qr);
          setQrDialogOpen(true);
          return;
        }
      } catch {
        // QR not ready yet
      }

      attempts++;
      setTimeout(poll, 2000);
    };

    poll();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session?')) return;

    setIsLoading(true);
    try {
      await sessionApi.delete(sessionId);
      removeSession(sessionId);
      toast.success('Session supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        );
      case 'qr_ready':
        return (
          <Badge variant="outline">
            <QrCode className="h-3 w-3 mr-1" />
            QR Prêt
          </Badge>
        );
      case 'initializing':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Initialisation
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sessions WhatsApp</h2>
          <p className="text-muted-foreground">Gérez vos connexions WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSessions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle session
          </Button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucune session WhatsApp</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setCreateDialogOpen(true)}
              >
                Créer votre première session
              </Button>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeSessionId === session.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveSession(session.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      {session.info?.pushname || session.id.slice(0, 12)}
                    </CardTitle>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
                {session.info?.phone && (
                  <p className="text-sm text-muted-foreground">+{session.info.phone}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Messages: {session.messageCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle session WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="ID de la session (ex: session1, support...)"
              value={newSessionId}
              onChange={(e) => setNewSessionId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSession} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scanner le QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrCode ? (
              <Image
                src={qrCode}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Ouvrez WhatsApp sur votre téléphone et scannez ce code
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
