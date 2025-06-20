
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Underline, 
  Highlighter, 
  Save, 
  Tag, 
  StickyNote,
  FileText,
  Calendar
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Article } from '@/services/storageService';

interface NotesEditorProps {
  article?: Article | null;
  onSaveToKnowledge: (article: Article) => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({ article, onSaveToKnowledge }) => {
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [highlights, setHighlights] = useState<Array<{ text: string; color: string; note: string }>>([]);
  const [selectedText, setSelectedText] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (article) {
      setContent(article.content);
      setNotes(article.notes || '');
      setTags(article.tags || []);
      setTitle(article.title);
      setHighlights(article.highlights?.map(h => ({ text: h.text, color: h.color, note: h.note || '' })) || []);
    } else {
      // Reset editor
      setContent('');
      setNotes('');
      setTags([]);
      setTitle('');
      setHighlights([]);
    }
  }, [article]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const addHighlight = (color: string) => {
    if (!selectedText) {
      toast({
        title: 'No text selected',
        description: 'Please select some text to highlight',
        variant: 'destructive',
      });
      return;
    }

    const newHighlight = {
      text: selectedText,
      color,
      note: ''
    };

    setHighlights([...highlights, newHighlight]);
    setSelectedText('');
    
    toast({
      title: 'Text highlighted',
      description: `Added ${color} highlight`,
    });
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const applyFormat = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (!selectedText) {
      toast({
        title: 'No text selected',
        description: 'Please select text to format',
        variant: 'destructive',
      });
      return;
    }

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const saveToKnowledge = () => {
    if (!title || !content) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide a title and content',
        variant: 'destructive',
      });
      return;
    }

    const savedArticle: Article = {
      id: article?.id || `editor_${Date.now()}`,
      title,
      content,
      notes,
      tags,
      highlights: highlights.map((h, index) => ({
        id: `highlight_${index}`,
        articleId: article?.id || `editor_${Date.now()}`,
        text: h.text,
        color: h.color,
        note: h.note,
        position: index
      })),
      author: article?.author || 'User',
      publishDate: article?.publishDate || Date.now(),
      summary: content.substring(0, 200) + '...',
      url: article?.url || '',
      isRead: true,
    };

    onSaveToKnowledge(savedArticle);
    
    toast({
      title: 'Saved to Knowledge Store',
      description: 'Your annotated article has been saved',
    });
  };

  const highlightColors = [
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-200' },
    { name: 'Green', value: 'green', class: 'bg-green-200' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-200' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-200' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-200' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article Editor
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => applyFormat('bold')}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyFormat('italic')}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyFormat('underline')}>
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
            
            <Textarea
              id="content-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onMouseUp={handleTextSelection}
              className="min-h-[500px] font-mono text-sm"
              placeholder={article ? "Edit your article content..." : "Import an article from RSS Reader or URL Fetcher to start editing..."}
            />

            {selectedText && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm">Selected: "{selectedText.substring(0, 50)}..."</span>
                <div className="flex gap-1">
                  {highlightColors.map((color) => (
                    <Button
                      key={color.value}
                      size="sm"
                      variant="outline"
                      className={`w-8 h-8 p-0 ${color.class}`}
                      onClick={() => addHighlight(color.value)}
                      title={`Highlight in ${color.name}`}
                    >
                      <Highlighter className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Panel */}
      <div className="space-y-4">
        {/* Article Info */}
        {article && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Article Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {article.author && (
                <div>
                  <span className="font-medium">Author:</span> {article.author}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(article.publishDate).toLocaleDateString()}</span>
              </div>
              {article.url && (
                <div>
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-xs"
                  >
                    View original
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] text-sm"
              placeholder="Add your notes and thoughts here..."
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="text-sm"
              />
              <Button size="sm" onClick={addTag} disabled={!newTag}>
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Highlights */}
        {highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Highlighter className="h-4 w-4" />
                Highlights ({highlights.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {highlights.map((highlight, index) => (
                <div key={index} className="p-2 rounded border">
                  <div className={`text-xs p-1 rounded mb-1 bg-${highlight.color}-200`}>
                    "{highlight.text.substring(0, 50)}..."
                  </div>
                  {highlight.note && (
                    <div className="text-xs text-muted-foreground">
                      {highlight.note}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Button onClick={saveToKnowledge} className="w-full" disabled={!title || !content}>
          <Save className="h-4 w-4 mr-2" />
          Save to Knowledge Store
        </Button>
      </div>
    </div>
  );
};
