'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { templateApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Trash2,
  Edit,
  Loader2,
  FileText,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Template } from '@/store/app-store';

export function TemplateManager() {
  const { templates, setTemplates } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await templateApi.list();
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setContent('');
    setCategory('');
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setContent(template.content);
      setCategory(template.category || '');
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error('Veuillez remplir le nom et le contenu');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        name: name.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
      };

      if (editingTemplate) {
        await templateApi.update(editingTemplate.id, data);
        toast.success('Template mis à jour');
      } else {
        await templateApi.create(data);
        toast.success('Template créé');
      }

      setDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template?')) return;

    setIsLoading(true);
    try {
      await templateApi.delete(id);
      toast.success('Template supprimé');
      loadTemplates();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Contenu copié');
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const cat = template.category || 'Sans catégorie';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates de Messages</h2>
          <p className="text-muted-foreground">
            Créez des modèles de messages réutilisables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTemplates} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
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

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun template</p>
            <Button variant="link" className="mt-2" onClick={() => handleOpenDialog()}>
              Créer votre premier template
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-lg font-semibold">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(template.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                      {template.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input
                placeholder="Ex: Message de bienvenue"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Input
                placeholder="Ex: Support, Ventes, etc."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contenu *</label>
              <Textarea
                placeholder="Bonjour {name}, merci de nous contacter..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Utilisez les variables comme {'{name}'}, {'{phone}'}, etc.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
