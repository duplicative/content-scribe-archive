import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Save, RefreshCw, Sparkles } from 'lucide-react';
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
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved settings
    setApiKey(AISummarizerService.getApiKey());
    setSelectedModel(AISummarizerService.getPreferredModel());
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    AISummarizerService.saveApiKey(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    AISummarizerService.savePreferredModel(value);
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
      const generatedSummary = await AISummarizerService.summarizeText({
        content: article.content,
        apiKey,
        model: selectedModel
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
