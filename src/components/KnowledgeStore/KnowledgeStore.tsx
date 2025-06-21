
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, FileText, Calendar, User, Send, Sparkles } from 'lucide-react';
import { storageService, type Article } from '@/services/storageService';
import { toast } from '@/hooks/use-toast';

interface KnowledgeStoreProps {
  onSendToEditor: (article: Article) => void;
  onSendToSummarizer: (article: Article) => void;
}

export const KnowledgeStore: React.FC<KnowledgeStoreProps> = ({ 
  onSendToEditor, 
  onSendToSummarizer 
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const articlesData = await storageService.getArticles();
      setArticles(articlesData);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => article.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = [...new Set(articles.flatMap(article => article.tags || []))];

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSendToEditor = (article: Article) => {
    onSendToEditor(article);
    toast({
      title: 'Sent to editor',
      description: 'Article is now available in the Notes Editor',
    });
  };

  const handleSendToSummarizer = (article: Article) => {
    onSendToSummarizer(article);
    toast({
      title: 'Sent to AI Summarizer',
      description: 'Article is ready for AI summarization',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Search and Filters */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Filter by Tags</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagFilter(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Articles:</span>
                <span>{articles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Filtered Results:</span>
                <span>{filteredArticles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Tags:</span>
                <span>{allTags.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles List */}
      <div className="space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Knowledge Store ({filteredArticles.length})
          </h2>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {articles.length === 0 ? 'No articles saved yet' : 'No articles match your search'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id} 
                className={`cursor-pointer transition-colors ${
                  selectedArticle?.id === article.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedArticle(article)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h3 className="font-medium line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.summary || article.content.substring(0, 150) + '...'}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {article.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {article.author}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.publishDate).toLocaleDateString()}
                      </span>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendToEditor(article);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendToSummarizer(article);
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Summarize
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail */}
      <div className="space-y-4">
        {selectedArticle ? (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="line-clamp-2">
                {selectedArticle.title}
              </CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {selectedArticle.author && (
                  <span>by {selectedArticle.author}</span>
                )}
                <span>
                  {new Date(selectedArticle.publishDate).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSendToEditor(selectedArticle)}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send to Editor
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendToSummarizer(selectedArticle)}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Summarize with AI
                </Button>
              </div>
              
              <div className="prose prose-sm max-w-none overflow-y-auto max-h-96">
                <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
              </div>

              {selectedArticle.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(selectedArticle.url, '_blank')}
                >
                  View Original
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an article to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
