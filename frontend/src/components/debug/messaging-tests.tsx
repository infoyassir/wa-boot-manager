'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { messagingApi } from '@/lib/debug-api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

interface Props {
  sessionId: string;
}

export function MessagingTests({ sessionId }: Props) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  // Form states
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('Hello from WhatsApp Bot Manager! 🤖');
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/400/300');
  const [imageCaption, setImageCaption] = useState('Test image caption');
  const [audioUrl, setAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [isPtt, setIsPtt] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4');
  const [videoCaption, setVideoCaption] = useState('Test video caption');
  const [docUrl, setDocUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [docFilename, setDocFilename] = useState('document.pdf');
  const [stickerUrl, setStickerUrl] = useState('https://raw.githubusercontent.com/nickreese/free-svg-images/main/icons/icon-star.svg');
  const [latitude, setLatitude] = useState('48.8566');
  const [longitude, setLongitude] = useState('2.3522');
  const [locationDesc, setLocationDesc] = useState('Paris, France');
  const [contactId, setContactId] = useState('');
  const [messageId, setMessageId] = useState('');
  const [replyText, setReplyText] = useState('This is a reply!');
  const [emoji, setEmoji] = useState('👍');
  const [pollName, setPollName] = useState('What is your favorite color?');
  const [pollOptions, setPollOptions] = useState('Red\nBlue\nGreen\nYellow');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [mentionMessage, setMentionMessage] = useState('Hello @user! This is a mention test.');
  const [mentionIds, setMentionIds] = useState('');

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
        data: response as Record<string, unknown>,
        timestamp: new Date(),
      });
      toast.success(`${name}: Test réussi!`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      addResult({
        name,
        success: false,
        message: err.response?.data?.error || err.message || 'Unknown error',
        timestamp: new Date(),
      });
      toast.error(`${name}: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(null);
    }
  };

  const TestCard = ({ 
    title, 
    description, 
    icon: Icon, 
    children, 
    onTest, 
    testName,
    disabled = false,
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    children: React.ReactNode;
    onTest: () => void;
    testName: string;
    disabled?: boolean;
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        <Button 
          onClick={onTest} 
          disabled={loading === testName || disabled}
          className="w-full"
        >
          {loading === testName ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Tester
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Forms */}
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Send Text */}
          <TestCard
            title="Send Text Message"
            description="Envoyer un message texte simple"
            icon={MessageSquare}
            testName="send-text"
            disabled={!recipient}
            onTest={() => runTest('Send Text', () => messagingApi.sendText(sessionId, recipient, message))}
          >
            <div className="space-y-3">
              <div>
                <Label>Destinataire (numéro)</Label>
                <Input
                  placeholder="33612345678"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="Votre message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </TestCard>

          {/* Send Image */}
          <TestCard
            title="Send Image"
            description="Envoyer une image avec légende"
            icon={ImageIcon}
            testName="send-image"
            disabled={!recipient}
            onTest={() => runTest('Send Image', () => messagingApi.sendImage(sessionId, recipient, imageUrl, imageCaption))}
          >
            <div className="space-y-3">
              <div>
                <Label>URL de l'image</Label>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Légende</Label>
                <Input
                  placeholder="Caption..."
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Send Audio */}
          <TestCard
            title="Send Audio"
            description="Envoyer un fichier audio ou vocal"
            icon={FileAudio}
            testName="send-audio"
            disabled={!recipient}
            onTest={() => runTest('Send Audio', () => messagingApi.sendAudio(sessionId, recipient, audioUrl, isPtt))}
          >
            <div className="space-y-3">
              <div>
                <Label>URL audio</Label>
                <Input
                  placeholder="https://..."
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Message vocal (PTT)</Label>
                <Switch checked={isPtt} onCheckedChange={setIsPtt} />
              </div>
            </div>
          </TestCard>

          {/* Send Video */}
          <TestCard
            title="Send Video"
            description="Envoyer une vidéo (Chrome requis)"
            icon={Video}
            testName="send-video"
            disabled={!recipient}
            onTest={() => runTest('Send Video', () => messagingApi.sendVideo(sessionId, recipient, videoUrl, videoCaption))}
          >
            <div className="space-y-3">
              <div>
                <Label>URL vidéo</Label>
                <Input
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Légende</Label>
                <Input
                  placeholder="Caption..."
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Send Document */}
          <TestCard
            title="Send Document"
            description="Envoyer un document/fichier"
            icon={FileText}
            testName="send-document"
            disabled={!recipient}
            onTest={() => runTest('Send Document', () => messagingApi.sendDocument(sessionId, recipient, docUrl, docFilename))}
          >
            <div className="space-y-3">
              <div>
                <Label>URL du document</Label>
                <Input
                  placeholder="https://..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Nom du fichier</Label>
                <Input
                  placeholder="document.pdf"
                  value={docFilename}
                  onChange={(e) => setDocFilename(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Send Sticker */}
          <TestCard
            title="Send Sticker"
            description="Envoyer un sticker"
            icon={Sticker}
            testName="send-sticker"
            disabled={!recipient}
            onTest={() => runTest('Send Sticker', () => messagingApi.sendSticker(sessionId, recipient, stickerUrl))}
          >
            <div className="space-y-3">
              <div>
                <Label>URL du sticker (PNG/WebP)</Label>
                <Input
                  placeholder="https://..."
                  value={stickerUrl}
                  onChange={(e) => setStickerUrl(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Send Location */}
          <TestCard
            title="Send Location"
            description="Envoyer une localisation GPS"
            icon={MapPin}
            testName="send-location"
            disabled={!recipient}
            onTest={() => runTest('Send Location', () => 
              messagingApi.sendLocation(sessionId, recipient, parseFloat(latitude), parseFloat(longitude), locationDesc)
            )}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Paris, France"
                  value={locationDesc}
                  onChange={(e) => setLocationDesc(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Send Contact */}
          <TestCard
            title="Send Contact Card"
            description="Envoyer une carte de contact"
            icon={Contact}
            testName="send-contact"
            disabled={!recipient || !contactId}
            onTest={() => runTest('Send Contact', () => messagingApi.sendContact(sessionId, recipient, contactId))}
          >
            <div className="space-y-3">
              <div>
                <Label>ID du contact à partager</Label>
                <Input
                  placeholder="33612345678"
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* React to Message */}
          <TestCard
            title="React to Message"
            description="Ajouter une réaction à un message"
            icon={Heart}
            testName="react-message"
            disabled={!messageId}
            onTest={() => runTest('React Message', () => messagingApi.reactMessage(sessionId, messageId, emoji))}
          >
            <div className="space-y-3">
              <div>
                <Label>Message ID</Label>
                <Input
                  placeholder="true_33612345678@c.us_3A..."
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                />
              </div>
              <div>
                <Label>Emoji</Label>
                <Input
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Reply to Message */}
          <TestCard
            title="Reply to Message"
            description="Répondre à un message spécifique"
            icon={Reply}
            testName="reply-message"
            disabled={!messageId}
            onTest={() => runTest('Reply Message', () => messagingApi.replyMessage(sessionId, messageId, replyText))}
          >
            <div className="space-y-3">
              <div>
                <Label>Message ID</Label>
                <Input
                  placeholder="true_33612345678@c.us_3A..."
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                />
              </div>
              <div>
                <Label>Réponse</Label>
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            </div>
          </TestCard>

          {/* Create Poll */}
          <TestCard
            title="Create Poll"
            description="Créer un sondage"
            icon={BarChart3}
            testName="create-poll"
            disabled={!recipient}
            onTest={() => runTest('Create Poll', () => 
              messagingApi.createPoll(sessionId, recipient, pollName, pollOptions.split('\n').filter(Boolean), allowMultiple)
            )}
          >
            <div className="space-y-3">
              <div>
                <Label>Question du sondage</Label>
                <Input
                  value={pollName}
                  onChange={(e) => setPollName(e.target.value)}
                />
              </div>
              <div>
                <Label>Options (une par ligne)</Label>
                <Textarea
                  value={pollOptions}
                  onChange={(e) => setPollOptions(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Choix multiples</Label>
                <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
              </div>
            </div>
          </TestCard>

          {/* Mention Users */}
          <TestCard
            title="Mention Users"
            description="Mentionner des utilisateurs"
            icon={AtSign}
            testName="send-mention"
            disabled={!recipient || !mentionIds}
            onTest={() => runTest('Send Mention', () => 
              messagingApi.sendMention(sessionId, recipient, mentionMessage, mentionIds.split(',').map(s => s.trim()))
            )}
          >
            <div className="space-y-3">
              <div>
                <Label>Message</Label>
                <Textarea
                  value={mentionMessage}
                  onChange={(e) => setMentionMessage(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>IDs à mentionner (séparés par virgule)</Label>
                <Input
                  placeholder="33612345678, 33687654321"
                  value={mentionIds}
                  onChange={(e) => setMentionIds(e.target.value)}
                />
              </div>
            </div>
          </TestCard>
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
                      {result.data && (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2).substring(0, 200)}
                        </pre>
                      )}
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
