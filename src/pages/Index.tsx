
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RSSReader } from '@/components/RSSReader/RSSReader';
import { URLFetcher } from '@/components/URLFetcher/URLFetcher';
import { NotesEditor } from '@/components/NotesEditor/NotesEditor';
import { KnowledgeStore } from '@/components/KnowledgeStore/KnowledgeStore';
import { AISummarizer } from '@/components/AISummarizer/AISummarizer';
import { AppHeader } from '@/components/Layout/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { storageService, type Article } from '@/services/storageService';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('rss');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [articleToSummarize, setArticleToSummarize] = useState<Article | null>(null);

  useEffect(() => {
    // Initialize storage service
    storageService.init();
  }, []);

  const handleSendToEditor = (article: Article) => {
    setCurrentArticle(article);
    setActiveTab('editor');
  };

  const handleSendToSummarizer = (article: Article) => {
    setArticleToSummarize(article);
    setActiveTab('summarize');
  };

  const handleSaveToKnowledge = (article: Article) => {
    storageService.saveArticle(article);
    setActiveTab('knowledge');
  };

  return (
    <div className={`min-h-screen bg-background text-foreground ${theme}`}>
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="rss" className="text-sm font-medium">
              RSS Reader
            </TabsTrigger>
            <TabsTrigger value="fetch" className="text-sm font-medium">
              URL to Markdown
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-sm font-medium">
              Notes Editor
            </TabsTrigger>
            <TabsTrigger value="summarize" className="text-sm font-medium">
              AI Summarizer
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="text-sm font-medium">
              Knowledge Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rss" className="mt-0">
            <RSSReader 
              onSendToEditor={handleSendToEditor}
              onSendToSummarizer={handleSendToSummarizer}
            />
          </TabsContent>

          <TabsContent value="fetch" className="mt-0">
            <URLFetcher 
              onSendToEditor={handleSendToEditor} 
              onSaveToKnowledge={handleSaveToKnowledge}
              onSendToSummarizer={handleSendToSummarizer}
            />
          </TabsContent>

          <TabsContent value="editor" className="mt-0">
            <NotesEditor article={currentArticle} onSaveToKnowledge={handleSaveToKnowledge} />
          </TabsContent>

          <TabsContent value="summarize" className="mt-0">
            <AISummarizer 
              article={articleToSummarize} 
              onSaveToKnowledge={handleSaveToKnowledge}
            />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-0">
            <KnowledgeStore 
              onSendToEditor={handleSendToEditor}
              onSendToSummarizer={handleSendToSummarizer}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
