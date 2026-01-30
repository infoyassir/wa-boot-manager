'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { scheduledApi, templateApi, contactApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Clock,
  Loader2,
  CalendarClock,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ScheduledMessage, Template, Contact } from '@/store/app-store';

const SCHEDULE_TYPES = [
  { value: 'once', label: 'Une seule fois' },
  { value: 'recurring', label: 'Récurrent (Cron)' },
];

export function ScheduledManager() {
  const { activeSessionId, scheduledMessages, setScheduledMessages, templates, setTemplates, contacts, setContacts } =
    useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);

  // Form state
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [scheduleType, setScheduleType] = useState<'once' | 'recurring'>('once');
  const [scheduledAt, setScheduledAt] = useState('');
  const [cronExpression, setCronExpression] = useState('');

  useEffect(() => {
    if (activeSessionId) {
      loadScheduledMessages();
      loadTemplates();
      loadContacts();
    }
  }, [activeSessionId]);

  const loadScheduledMessages = async () => {
    if (!activeSessionId) return;

    setIsLoading(true);
    try {
      const res = await scheduledApi.list(activeSessionId);
      if (res.data.success) {
        setScheduledMessages(res.data.data);
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      toast.error('Erreur lors du chargement des messages planifiés');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await templateApi.list();
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const res = await contactApi.list();
      if (res.data.success) {
        setContacts(res.data.data);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const resetForm = () => {
    setRecipient('');
    setMessage('');
    setTemplateId('');
    setScheduleType('once');
    setScheduledAt('');
    setCronExpression('');
    setEditingMessage(null);
  };

  const handleOpenDialog = (msg?: ScheduledMessage) => {
    if (msg) {
      setEditingMessage(msg);
      setRecipient(msg.recipient);
      setMessage(msg.message);
      setTemplateId(msg.templateId || '');
      setScheduleType(msg.type);
      setScheduledAt(msg.scheduledAt ? format(new Date(msg.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '');
      setCronExpression(msg.cronExpression || '');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!activeSessionId) return;
    if (!recipient.trim() || (!message.trim() && !templateId)) {
      toast.error('Veuillez remplir le destinataire et le message');
      return;
    }
    if (scheduleType === 'once' && !scheduledAt) {
      toast.error('Veuillez sélectionner une date et heure');
      return;
    }
    if (scheduleType === 'recurring' && !cronExpression) {
      toast.error('Veuillez entrer une expression cron');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        recipient: recipient.trim(),
        message: message.trim(),
        templateId: templateId || undefined,
        type: scheduleType,
        scheduledAt: scheduleType === 'once' ? new Date(scheduledAt).toISOString() : undefined,
        cronExpression: scheduleType === 'recurring' ? cronExpression : undefined,
        enabled: true,
      };

      if (editingMessage) {
        await scheduledApi.update(activeSessionId, editingMessage.id, data);
        toast.success('Message planifié mis à jour');
      } else {
        await scheduledApi.create(activeSessionId, data);
        toast.success('Message planifié créé');
      }

      setDialogOpen(false);
      resetForm();
      loadScheduledMessages();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (msg: ScheduledMessage) => {
    if (!activeSessionId) return;

    try {
      await scheduledApi.update(activeSessionId, msg.id, { enabled: !msg.enabled });
      loadScheduledMessages();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeSessionId) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message planifié?')) return;

    setIsLoading(true);
    try {
      await scheduledApi.delete(activeSessionId, id);
      toast.success('Message planifié supprimé');
      loadScheduledMessages();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunNow = async (id: string) => {
    if (!activeSessionId) return;

    try {
      await scheduledApi.runNow(activeSessionId, id);
      toast.success('Message envoyé');
      loadScheduledMessages();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
  };

  const getStatusBadge = (msg: ScheduledMessage) => {
    if (!msg.enabled) {
      return <Badge variant="secondary">Désactivé</Badge>;
    }
    switch (msg.status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600">En attente</Badge>;
      case 'sent':
        return <Badge className="bg-green-500/10 text-green-600">Envoyé</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600">Échoué</Badge>;
      default:
        return <Badge variant="outline">{msg.status}</Badge>;
    }
  };

  if (!activeSessionId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <CalendarClock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            Sélectionnez une session WhatsApp pour gérer les messages planifiés
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages Planifiés</h2>
          <p className="text-muted-foreground">
            Programmez des messages à envoyer automatiquement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadScheduledMessages} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau message
          </Button>
        </div>
      </div>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Actif</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Planification</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucun message planifié</p>
                  </TableCell>
                </TableRow>
              ) : (
                scheduledMessages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell>
                      <Switch
                        checked={msg.enabled}
                        onCheckedChange={() => handleToggle(msg)}
                      />
                    </TableCell>
                    <TableCell>
                      {contacts.find((c) => c.phone === msg.recipient)?.name || msg.recipient}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {msg.templateId
                        ? templates.find((t) => t.id === msg.templateId)?.name || 'Template'
                        : msg.message}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {msg.type === 'once' ? 'Une fois' : 'Récurrent'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {msg.type === 'once' && msg.scheduledAt
                            ? formatDate(msg.scheduledAt)
                            : msg.cronExpression}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(msg)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRunNow(msg.id)}
                        title="Envoyer maintenant"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(msg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(msg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMessage ? 'Modifier le message' : 'Nouveau message planifié'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destinataire *</label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.phone}>
                      {contact.name} ({contact.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Ou entrez un numéro (ex: 33612345678@c.us)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template (optionnel)</label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message {!templateId && '*'}</label>
              <Textarea
                placeholder="Contenu du message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                disabled={!!templateId}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de planification</label>
              <Select value={scheduleType} onValueChange={(v: 'once' | 'recurring') => setScheduleType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'once' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Date et heure *</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Expression Cron *</label>
                <Input
                  placeholder="Ex: 0 9 * * 1 (chaque lundi à 9h)"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: minute heure jour mois jour-semaine
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMessage ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
