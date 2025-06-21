import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Send, Star, Calendar, Sparkles } from 'lucide-react';
import { RSSParser } from '@/services/rssParser';
import { storageService, type Feed, type Article } from '@/services/storageService';
import { toast } from '@/hooks/use-toast';

interface RSSReaderProps {
  onSendToEditor: (article: Article) => void;
  onSendToSummarizer: (article: Article) => void;
}

export const RSSReader: React.FC<RSSReaderProps> = ({ onSendToEditor, onSendToSummarizer }) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFeeds();
    loadArticles();
  }, []);

  const loadFeeds = async () => {
    try {
      const feedsData = await storageService.getFeeds();
      setFeeds(feedsData);
    } catch (error) {
      console.error('Failed to load feeds:', error);
    }
  };

  const loadArticles = async () => {
    try {
      const articlesData = await storageService.getArticles();
      setArticles(articlesData.filter(article => article.feedId));
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const addFeed = async () => {
    if (!newFeedUrl) return;
    
    setIsLoading(true);
    try {
      const feedData = await RSSParser.fetchAndParse(newFeedUrl);
      
      const feedId = await storageService.saveFeed({
        url: newFeedUrl,
        title: feedData.title,
        description: feedData.description,
        category: 'General',
        lastUpdated: Date.now(),
        updateInterval: 3600000 // 1 hour
      });

      // Save articles from the feed
      for (const item of feedData.items) {
        await storageService.saveArticle({
          feedId,
          title: item.title,
          author: item.author,
          publishDate: new Date(item.pubDate).getTime() || Date.now(),
          content: item.description,
          summary: item.description.substring(0, 200) + '...',
          url: item.link,
          isRead: false,
          tags: []
        });
      }

      await loadFeeds();
      await loadArticles();
      setNewFeedUrl('');
      
      toast({
        title: 'Feed added successfully',
        description: `Added ${feedData.title} with ${feedData.items.length} articles`,
      });
    } catch (error) {
      console.error('Failed to add feed:', error);
      toast({
        title: 'Failed to add feed',
        description: 'Please check the URL and try again',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const getFilteredArticles = () => {
    if (!selectedFeed) return articles;
    return articles.filter(article => article.feedId === selectedFeed);
  };

  const getUnreadCount = (feedId: string) => {
    return articles.filter(article => article.feedId === feedId && !article.isRead).length;
  };

  const markAsRead = async (article: Article) => {
    const updatedArticle = { ...article, isRead: true };
    await storageService.updateArticle(updatedArticle);
    await loadArticles();
  };

  const handleSendToEditor = (article: Article) => {
    markAsRead(article);
    onSendToEditor(article);
  };

  const handleSendToSummarizer = (article: Article) => {
    markAsRead(article);
    onSendToSummarizer(article);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Feed Management */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add RSS Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="RSS feed URL"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
            />
            <Button 
              onClick={addFeed} 
              disabled={isLoading || !newFeedUrl}
              className="w-full"
            >
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Add Feed
            </Button>
          </CardContent>
        </Card>

        {/* Feeds List */}
        <Card>
          <CardHeader>
            <CardTitle>RSS Feeds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedFeed === null ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFeed(null)}
            >
              All Articles
              <Badge variant="secondary" className="ml-auto">
                {articles.filter(a => !a.isRead).length}
              </Badge>
            </Button>
            {feeds.map((feed) => (
              <Button
                key={feed.id}
                variant={selectedFeed === feed.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFeed(feed.id)}
              >
                <div className="flex-1 text-left truncate">
                  {feed.title}
                </div>
                {getUnreadCount(feed.id) > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getUnreadCount(feed.id)}
                  </Badge>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Articles List */}
      <div className="lg:col-span-2 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {selectedFeed ? feeds.find(f => f.id === selectedFeed)?.title : 'All Articles'}
          </h2>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {getFilteredArticles().length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {feeds.length === 0 ? 'Add your first RSS feed to get started' : 'No articles found'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {getFilteredArticles().map((article) => (
              <Card key={article.id} className={article.isRead ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {article.author && (
                          <span>by {article.author}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.publishDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendToEditor(article)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendToSummarizer(article)}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Summarize
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
