
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Link, Download, Send, Save, RefreshCw } from 'lucide-react';
import { URLToMarkdownConverter } from '@/services/urlToMarkdown';
import { toast } from '@/hooks/use-toast';
import type { Article } from '@/services/storageService';

interface URLFetcherProps {
  onSendToEditor: (article: Article) => void;
  onSaveToKnowledge: (article: Article) => void;
}

export const URLFetcher: React.FC<URLFetcherProps> = ({ onSendToEditor, onSaveToKnowledge }) => {
  const [url, setUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convertedContent, setConvertedContent] = useState<{
    markdown: string;
    title: string;
    metadata: any;
  } | null>(null);
  const [editableMarkdown, setEditableMarkdown] = useState('');

  const addUrl = () => {
    if (url && !urls.includes(url)) {
      setUrls([...urls, url]);
      setUrl('');
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setUrls(urls.filter(u => u !== urlToRemove));
  };

  const convertSingleUrl = async (urlToConvert: string) => {
    setIsLoading(true);
    try {
      const result = await URLToMarkdownConverter.convertURL(urlToConvert);
      setConvertedContent(result);
      setEditableMarkdown(result.markdown);
      
      toast({
        title: 'URL converted successfully',
        description: `Converted: ${result.title}`,
      });
    } catch (error) {
      console.error('Failed to convert URL:', error);
      toast({
        title: 'Conversion failed',
        description: 'Please check the URL and try again',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const convertBatchUrls = async () => {
    if (urls.length === 0) return;
    
    setIsLoading(true);
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await URLToMarkdownConverter.convertURL(url);
        results.push(result);
      } catch (error) {
        console.error(`Failed to convert ${url}:`, error);
      }
    }
    
    if (results.length > 0) {
      // Combine all results into one document
      const combinedMarkdown = results
        .map(result => `# ${result.title}\n\n${result.markdown}\n\n---\n\n`)
        .join('');
      
      setConvertedContent({
        markdown: combinedMarkdown,
        title: `Batch Conversion (${results.length} articles)`,
        metadata: {
          title: `Batch Conversion (${results.length} articles)`,
          extractedAt: new Date().toISOString(),
          sources: results.map(r => r.metadata.url)
        }
      });
      setEditableMarkdown(combinedMarkdown);
      
      toast({
        title: 'Batch conversion completed',
        description: `Successfully converted ${results.length} out of ${urls.length} URLs`,
      });
    }
    
    setIsLoading(false);
  };

  const createArticleFromContent = (): Article => {
    if (!convertedContent) throw new Error('No content to create article from');
    
    return {
      id: `url_${Date.now()}`,
      title: convertedContent.title,
      author: convertedContent.metadata.author || 'Unknown',
      publishDate: Date.now(),
      content: editableMarkdown,
      summary: editableMarkdown.substring(0, 200) + '...',
      url: convertedContent.metadata.url || '',
      isRead: false,
      tags: ['url-fetched'],
    };
  };

  const handleSendToEditor = () => {
    try {
      const article = createArticleFromContent();
      onSendToEditor(article);
      toast({
        title: 'Sent to editor',
        description: 'Article is now available in the Notes Editor',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send to editor',
        variant: 'destructive',
      });
    }
  };

  const handleSaveToKnowledge = () => {
    try {
      const article = createArticleFromContent();
      onSaveToKnowledge(article);
      toast({
        title: 'Saved to knowledge store',
        description: 'Article has been saved to your knowledge base',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save to knowledge store',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* URL Input Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              URL to Markdown Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter URL to convert..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <Button onClick={addUrl} disabled={!url}>
                Add
              </Button>
            </div>

            {url && (
              <Button
                onClick={() => convertSingleUrl(url)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Convert Single URL
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Batch URLs */}
        {urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Batch URLs ({urls.length})
                <Button
                  onClick={convertBatchUrls}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Convert All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {urls.map((urlItem, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1 justify-start truncate">
                      {urlItem}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUrl(urlItem)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Types Info */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">HTML</Badge>
                <span>Web articles and blog posts</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">PDF</Badge>
                <span>Document conversion</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">YouTube</Badge>
                <span>Video transcripts</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Social</Badge>
                <span>Twitter/X threads</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="space-y-4">
        {convertedContent ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Converted Content</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleSendToEditor}>
                      <Send className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" onClick={handleSaveToKnowledge}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{convertedContent.title}</h3>
                    {convertedContent.metadata.author && (
                      <p className="text-sm text-muted-foreground">
                        by {convertedContent.metadata.author}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {convertedContent.markdown.split('\n').length} lines
                    </Badge>
                    <Badge variant="outline">
                      {convertedContent.markdown.length} chars
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Edit Markdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editableMarkdown}
                  onChange={(e) => setEditableMarkdown(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Converted markdown will appear here..."
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a URL above to convert it to markdown</p>
              <p className="text-sm mt-2">Supports articles, PDFs, videos, and more</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
