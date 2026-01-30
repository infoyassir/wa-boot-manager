'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { sessionApi, autoResponderApi, scheduledApi, templateApi, contactApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  MessageSquare,
  Bot,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  sessions: number;
  activeSessions: number;
  contacts: number;
  templates: number;
  autoResponders: number;
  scheduledMessages: number;
}

export function DashboardStats() {
  const { sessions, setActiveSession, activeSessionId } = useAppStore();
  const [stats, setStats] = useState<Stats>({
    sessions: 0,
    activeSessions: 0,
    contacts: 0,
    templates: 0,
    autoResponders: 0,
    scheduledMessages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, templatesRes, contactsRes] = await Promise.all([
        sessionApi.list(),
        templateApi.list(),
        contactApi.list(),
      ]);

      const sessionsList = sessionsRes.data.success ? sessionsRes.data.data : [];
      const templatesList = templatesRes.data.success ? templatesRes.data.data : [];
      const contactsList = contactsRes.data.success ? contactsRes.data.data : [];

      // Get auto-responders and scheduled messages for active session
      let autoRespondersCount = 0;
      let scheduledCount = 0;

      if (sessionsList.length > 0 && activeSessionId) {
        try {
          const [arRes, schRes] = await Promise.all([
            autoResponderApi.list(activeSessionId),
            scheduledApi.list(activeSessionId),
          ]);
          autoRespondersCount = arRes.data.success ? arRes.data.data.length : 0;
          scheduledCount = schRes.data.success ? schRes.data.data.length : 0;
        } catch {
          // Ignore errors for these
        }
      }

      setStats({
        sessions: sessionsList.length,
        activeSessions: sessionsList.filter((s: { status: string }) => s.status === 'connected').length,
        contacts: contactsList.length,
        templates: templatesList.length,
        autoResponders: autoRespondersCount,
        scheduledMessages: scheduledCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Sessions WhatsApp',
      value: `${stats.activeSessions}/${stats.sessions}`,
      description: 'Sessions actives',
      icon: Smartphone,
      href: '/sessions',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Contacts',
      value: stats.contacts.toString(),
      description: 'Contacts enregistrés',
      icon: Users,
      href: '/contacts',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Templates',
      value: stats.templates.toString(),
      description: 'Modèles de messages',
      icon: FileText,
      href: '/templates',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Auto-Réponses',
      value: stats.autoResponders.toString(),
      description: 'Règles actives',
      icon: Bot,
      href: '/auto-responders',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Messages Planifiés',
      value: stats.scheduledMessages.toString(),
      description: 'Messages programmés',
      icon: Calendar,
      href: '/scheduled',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre bot WhatsApp
          </p>
        </div>
        <Button variant="outline" onClick={loadStats} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions Rapides</CardTitle>
          <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/sessions">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Smartphone className="h-6 w-6" />
                <span>Nouvelle Session</span>
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <MessageSquare className="h-6 w-6" />
                <span>Envoyer Message</span>
              </Button>
            </Link>
            <Link href="/auto-responders">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Bot className="h-6 w-6" />
                <span>Auto-Réponse</span>
              </Button>
            </Link>
            <Link href="/scheduled">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>Planifier Message</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Fonctionnalités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Multi-sessions WhatsApp</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Auto-réponses intelligentes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Messages planifiés (Cron)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Templates avec variables</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Gestion des contacts</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Envoi de médias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Guide de Démarrage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Créer une session</p>
                <p className="text-xs text-muted-foreground">
                  Connectez WhatsApp en scannant le QR code
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Ajouter des contacts</p>
                <p className="text-xs text-muted-foreground">
                  Importez ou créez vos contacts
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Configurer auto-réponses</p>
                <p className="text-xs text-muted-foreground">
                  Définissez des règles de réponse automatique
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <p className="text-sm font-medium">Envoyer des messages</p>
                <p className="text-xs text-muted-foreground">
                  Utilisez le chat ou planifiez des envois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
