
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Folder, 
  FileText, 
  Download, 
  Send, 
  Trash2, 
  Calendar,
  Tag,
  Star
} from 'lucide-react';
import { storageService, type Article } from '@/services/storageService';
import { toast } from '@/hooks/use-toast';

interface KnowledgeStoreProps {
  onSendToEditor: (article: Article) => void;
}

export const KnowledgeStore: React.FC<KnowledgeStoreProps> = ({ onSendToEditor }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'author'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'reading'>('list');

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery, selectedTags, sortBy]);

  const loadArticles = async () => {
    try {
      const articlesData = await storageService.getArticles();
      setArticles(articlesData);
      
      // Extract all unique tags
      const tags = new Set<string>();
      articlesData.forEach(article => {
        article.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.notes?.toLowerCase().includes(query) ||
        article.author?.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(article =>
        selectedTags.some(tag => article.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'date':
        default:
          return b.publishDate - a.publishDate;
      }
    });

    setFilteredArticles(filtered);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const deleteArticle = async (article: Article) => {
    try {
      await storageService.deleteArticle(article.id);
      await loadArticles();
      if (selectedArticle?.id === article.id) {
        setSelectedArticle(null);
      }
      toast({
        title: 'Article deleted',
        description: 'The article has been removed from your knowledge store',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete article',
        description: 'An error occurred while deleting the article',
        variant: 'destructive',
      });
    }
  };

  const exportArticle = (article: Article, format: 'markdown' | 'html' | 'json') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'markdown':
        content = `# ${article.title}\n\n${article.content}\n\n## Notes\n\n${article.notes || 'No notes'}\n\n## Tags\n\n${article.tags.join(', ')}`;
        filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        mimeType = 'text/markdown';
        break;
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${article.title}</title></head><body><h1>${article.title}</h1><div>${article.content.replace(/\n/g, '<br>')}</div></body></html>`;
        filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        mimeType = 'text/html';
        break;
      case 'json':
        content = JSON.stringify(article, null, 2);
        filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export completed',
      description: `Article exported as ${format.toUpperCase()}`,
    });
  };

  const getArticleStats = () => {
    return {
      total: articles.length,
      withNotes: articles.filter(a => a.notes && a.notes.length > 0).length,
      withHighlights: articles.filter(a => a.highlights && a.highlights.length > 0).length,
      tagged: articles.filter(a => a.tags.length > 0).length,
    };
  };

  const stats = getArticleStats();

  if (viewMode === 'reading' && selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setViewMode('list')}>
            ← Back to List
          </Button>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onSendToEditor(selectedArticle)}
            >
              <Send className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => exportArticle(selectedArticle, 'markdown')}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {selectedArticle.author && <span>by {selectedArticle.author}</span>}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(selectedArticle.publishDate).toLocaleDateString()}
              </span>
            </div>
            {selectedArticle.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedArticle.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
            </div>
            
            {selectedArticle.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Notes</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="whitespace-pre-wrap">{selectedArticle.notes}</div>
                  </div>
                </div>
              </>
            )}

            {selectedArticle.highlights && selectedArticle.highlights.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Highlights</h3>
                  <div className="space-y-2">
                    {selectedArticle.highlights.map((highlight, index) => (
                      <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                        <div className="bg-yellow-100 p-2 rounded text-sm">
                          "{highlight.text}"
                        </div>
                        {highlight.note && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {highlight.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Filters Sidebar */}
      <div className="space-y-4">
        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge Store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Articles:</span>
              <Badge>{stats.total}</Badge>
            </div>
            <div className="flex justify-between">
              <span>With Notes:</span>
              <Badge variant="secondary">{stats.withNotes}</Badge>
            </div>
            <div className="flex justify-between">
              <span>With Highlights:</span>
              <Badge variant="secondary">{stats.withHighlights}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Tagged:</span>
              <Badge variant="secondary">{stats.tagged}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Sort */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Sort By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { value: 'date', label: 'Date' },
              { value: 'title', label: 'Title' },
              { value: 'author', label: 'Author' },
            ].map(option => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSortBy(option.value as any)}
              >
                {option.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                Filter by Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Articles List */}
      <div className="lg:col-span-3 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Articles ({filteredArticles.length})
          </h2>
        </div>

        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {articles.length === 0 ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No articles in your knowledge store yet</p>
                  <p className="text-sm mt-2">Save articles from RSS Reader or URL Fetcher to get started</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No articles match your search criteria</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => {
                      setSelectedArticle(article);
                      setViewMode('reading');
                    }}>
                      <h3 className="font-medium line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        {article.author && (
                          <span>by {article.author}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.publishDate).toLocaleDateString()}
                        </span>
                        {article.notes && (
                          <Badge variant="outline" className="text-xs">
                            Has Notes
                          </Badge>
                        )}
                        {article.highlights && article.highlights.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {article.highlights.length} Highlights
                          </Badge>
                        )}
                      </div>
                      {article.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {article.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendToEditor(article)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportArticle(article, 'markdown')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteArticle(article)}
                      >
                        <Trash2 className="h-4 w-4" />
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
