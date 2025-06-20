
import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, BookOpen } from 'lucide-react';

interface AppHeaderProps {
  theme: string;
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary rounded-lg">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ReadLater</h1>
            <p className="text-sm text-muted-foreground">RSS Reader & Knowledge Manager</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            className="h-9 w-9 p-0"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
