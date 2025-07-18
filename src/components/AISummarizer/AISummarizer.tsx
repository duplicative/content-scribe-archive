import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bot, Save, RefreshCw, Sparkles, Plus } from 'lucide-react';
import { AISummarizer as AISummarizerService } from '@/services/aiSummarizer';
import { storageService, type Article } from '@/services/storageService';
import { toast } from '@/hooks/use-toast';

interface AISummarizerProps {
  article: Article | null;
  onSaveToKnowledge: (article: Article) => void;
}

export const AISummarizer: React.FC<AISummarizerProps> = ({ article, onSaveToKnowledge }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompts, setCustomPrompts] = useState<Array<{id: string, name: string, content: string}>>([]);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved settings
    setApiKey(AISummarizerService.getApiKey());
    setSelectedModel(AISummarizerService.getPreferredModel());
    setSelectedPrompt(AISummarizerService.getSelectedPrompt());
    setCustomPrompts(AISummarizerService.getCustomPrompts());
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    AISummarizerService.saveApiKey(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    AISummarizerService.savePreferredModel(value);
  };

  const handlePromptChange = (value: string) => {
    setSelectedPrompt(value);
    AISummarizerService.saveSelectedPrompt(value);
  };

  const handleAddPrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;
    
    const newPrompt = {
      id: Date.now().toString(),
      name: newPromptName.trim(),
      content: newPromptContent.trim()
    };
    
    const updatedPrompts = [...customPrompts, newPrompt];
    setCustomPrompts(updatedPrompts);
    AISummarizerService.saveCustomPrompts(updatedPrompts);
    
    setNewPromptName('');
    setNewPromptContent('');
    setIsDialogOpen(false);
    
    toast({
      title: 'Prompt saved',
      description: 'Custom prompt has been added successfully',
    });
  };

  const handleSummarize = async () => {
    if (!article) {
      setError('No article selected for summarization');
      return;
    }

    if (!apiKey) {
      setError('Please enter your OpenRouter API key');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const allPrompts = AISummarizerService.getAllPrompts();
      const selectedPromptObj = allPrompts.find(p => p.id === selectedPrompt);
      
      const generatedSummary = await AISummarizerService.summarizeText({
        content: article.content,
        apiKey,
        model: selectedModel,
        prompt: selectedPromptObj?.content
      });

      setSummary(generatedSummary);
      toast({
        title: 'Summary generated successfully',
        description: 'AI summary has been created for your article',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      toast({
        title: 'Summarization failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToKnowledge = async () => {
    if (!summary || !article) return;

    try {
      const summaryArticle: Omit<Article, 'id'> = {
        title: `AI Summary: ${article.title}`,
        author: 'AI Assistant',
        publishDate: Date.now(),
        content: summary,
        summary: summary.substring(0, 200) + '...',
        url: article.url,
        isRead: false,
        tags: ['AI Summary'],
        notes: `Original article: ${article.title}\nSource: ${article.url}`
      };

      await storageService.saveArticle(summaryArticle);
      onSaveToKnowledge(summaryArticle as Article);
      
      toast({
        title: 'Summary saved',
        description: 'AI summary has been saved to your knowledge store',
      });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: 'Failed to save summary to knowledge store',
        variant: 'destructive',
      });
    }
  };

  const availableModels = AISummarizerService.getAvailableModels();
  const allPrompts = AISummarizerService.getAllPrompts();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary rounded-lg">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Summarizer</h1>
          <p className="text-muted-foreground">Generate intelligent summaries using AI</p>
        </div>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenRouter API Key</label>
            <Input
              type="password"
              placeholder="Enter your OpenRouter API key..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter.ai</a>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an AI model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Prompt Template</label>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Prompt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prompt Name</label>
                      <Input
                        placeholder="Enter prompt name..."
                        value={newPromptName}
                        onChange={(e) => setNewPromptName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prompt Content</label>
                      <Textarea
                        placeholder="Enter your prompt template..."
                        value={newPromptContent}
                        onChange={(e) => setNewPromptContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button 
                      onClick={handleAddPrompt}
                      disabled={!newPromptName.trim() || !newPromptContent.trim()}
                      className="w-full"
                    >
                      Save Prompt
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={selectedPrompt} onValueChange={handlePromptChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a prompt template" />
              </SelectTrigger>
              <SelectContent>
                {allPrompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Article to Summarize */}
      {article ? (
        <Card>
          <CardHeader>
            <CardTitle>Article to Summarize</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="font-medium">{article.title}</h3>
              {article.author && (
                <p className="text-sm text-muted-foreground">by {article.author}</p>
              )}
              <div className="max-h-40 overflow-y-auto text-sm bg-muted p-3 rounded">
                {article.content.substring(0, 500)}...
              </div>
              <Button
                onClick={handleSummarize}
                disabled={isLoading || !apiKey}
                className="w-full"
              >
                {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Generate AI Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No article selected for summarization</p>
            <p className="text-sm mt-2">Use "Summarize with AI" button from other tabs</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Display */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              AI Generated Summary
              <Button onClick={handleSaveToKnowledge} size="sm">
                <Save className="h-4 w-4 mr-1" />
                Save to Knowledge Store
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[200px]"
              placeholder="Generated summary will appear here..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
