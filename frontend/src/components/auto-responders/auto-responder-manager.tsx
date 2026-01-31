'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { autoResponderApi, templateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Bot,
  Loader2,
  MessageSquareText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AutoResponderRule, Template } from '@/store/app-store';

const MATCH_TYPES = [
  { value: 'exact', label: 'Correspondance exacte' },
  { value: 'contains', label: 'Contient' },
  { value: 'startsWith', label: 'Commence par' },
  { value: 'endsWith', label: 'Termine par' },
  { value: 'regex', label: 'Expression régulière' },
];

export function AutoResponderManager() {
  const { activeSessionId, autoResponders, setAutoResponders, templates, setTemplates } =
    useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoResponderRule | null>(null);

  // Form state
  const [trigger, setTrigger] = useState('');
  const [matchType, setMatchType] = useState<'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex'>('contains');
  const [response, setResponse] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    if (activeSessionId) {
      loadAutoResponders();
      loadTemplates();
    }
  }, [activeSessionId]);

  const loadAutoResponders = async () => {
    if (!activeSessionId) return;

    setIsLoading(true);
    try {
      const res = await autoResponderApi.list(activeSessionId);
      if (res.data.success) {
        setAutoResponders(res.data.data);
      }
    } catch (error) {
      console.error('Error loading auto-responders:', error);
      toast.error('Erreur lors du chargement des auto-réponses');
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

  const resetForm = () => {
    setTrigger('');
    setMatchType('contains');
    setResponse('');
    setTemplateId('');
    setPriority(0);
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: AutoResponderRule) => {
    if (rule) {
      setEditingRule(rule);
      setTrigger(rule.trigger);
      setMatchType(rule.matchType);
      setResponse(rule.response);
      setTemplateId(rule.templateId || '');
      setPriority(rule.priority);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!activeSessionId) return;
    const hasTemplate = templateId && templateId !== 'none';
    if (!trigger.trim() || (!response.trim() && !hasTemplate)) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        trigger: trigger.trim(),
        matchType,
        response: response.trim(),
        templateId: (templateId && templateId !== 'none') ? templateId : undefined,
        priority,
        enabled: true,
      };

      if (editingRule) {
        await autoResponderApi.update(activeSessionId, editingRule.id, data);
        toast.success('Règle mise à jour');
      } else {
        await autoResponderApi.create(activeSessionId, data);
        toast.success('Règle créée');
      }

      setDialogOpen(false);
      resetForm();
      loadAutoResponders();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (rule: AutoResponderRule) => {
    if (!activeSessionId) return;

    try {
      await autoResponderApi.update(activeSessionId, rule.id, {
        enabled: !rule.enabled,
      });
      loadAutoResponders();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeSessionId) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle?')) return;

    setIsLoading(true);
    try {
      await autoResponderApi.delete(activeSessionId, id);
      toast.success('Règle supprimée');
      loadAutoResponders();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeSessionId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            Sélectionnez une session WhatsApp pour gérer les auto-réponses
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
          <h2 className="text-2xl font-bold">Auto-Réponses</h2>
          <p className="text-muted-foreground">
            Configurez des réponses automatiques basées sur des règles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAutoResponders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>
      </div>

      {/* Variables Info */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-muted-foreground">Variables disponibles:</span>
            <Badge variant="secondary">{'{name}'}</Badge>
            <Badge variant="secondary">{'{phone}'}</Badge>
            <Badge variant="secondary">{'{message}'}</Badge>
            <Badge variant="secondary">{'{time}'}</Badge>
            <Badge variant="secondary">{'{date}'}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Actif</TableHead>
                <TableHead>Déclencheur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réponse</TableHead>
                <TableHead className="w-20">Priorité</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autoResponders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <MessageSquareText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucune règle d'auto-réponse</p>
                  </TableCell>
                </TableRow>
              ) : (
                autoResponders.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggle(rule)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{rule.trigger}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MATCH_TYPES.find((t) => t.value === rule.matchType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {rule.templateId
                        ? templates.find((t) => t.id === rule.templateId)?.name || 'Template'
                        : rule.response}
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(rule.id)}
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
              {editingRule ? 'Modifier la règle' : 'Nouvelle règle d\'auto-réponse'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Déclencheur *</label>
              <Input
                placeholder="Mot ou phrase déclencheur..."
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de correspondance</label>
              <Select value={matchType} onValueChange={(v: typeof matchType) => setMatchType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template (optionnel)</label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Réponse {(!templateId || templateId === 'none') && '*'}
              </label>
              <Textarea
                placeholder="Message de réponse..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                disabled={!!(templateId && templateId !== 'none')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Input
                type="number"
                min={0}
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Les règles avec une priorité plus élevée sont évaluées en premier
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
