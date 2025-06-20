
interface Feed {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  lastUpdated: number;
  updateInterval: number;
  favicon?: string;
}

interface Article {
  id: string;
  feedId?: string;
  title: string;
  author?: string;
  publishDate: number;
  content: string;
  summary?: string;
  url: string;
  isRead: boolean;
  tags: string[];
  notes?: string;
  highlights?: Highlight[];
}

interface Highlight {
  id: string;
  articleId: string;
  text: string;
  color: string;
  note?: string;
  position: number;
}

class StorageService {
  private db: IDBDatabase | null = null;
  private dbName = 'ReadLaterApp';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create feeds store
        if (!db.objectStoreNames.contains('feeds')) {
          const feedsStore = db.createObjectStore('feeds', { keyPath: 'id' });
          feedsStore.createIndex('category', 'category', { unique: false });
          feedsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Create articles store
        if (!db.objectStoreNames.contains('articles')) {
          const articlesStore = db.createObjectStore('articles', { keyPath: 'id' });
          articlesStore.createIndex('feedId', 'feedId', { unique: false });
          articlesStore.createIndex('isRead', 'isRead', { unique: false });
          articlesStore.createIndex('publishDate', 'publishDate', { unique: false });
          articlesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Create highlights store
        if (!db.objectStoreNames.contains('highlights')) {
          const highlightsStore = db.createObjectStore('highlights', { keyPath: 'id' });
          highlightsStore.createIndex('articleId', 'articleId', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveArticle(article: Omit<Article, 'id'>): Promise<string> {
    const id = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullArticle: Article = { ...article, id };
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['articles'], 'readwrite');
      const store = transaction.objectStore('articles');
      const request = store.add(fullArticle);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getArticles(): Promise<Article[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['articles'], 'readonly');
      const store = transaction.objectStore('articles');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateArticle(article: Article): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['articles'], 'readwrite');
      const store = transaction.objectStore('articles');
      const request = store.put(article);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteArticle(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['articles'], 'readwrite');
      const store = transaction.objectStore('articles');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveFeed(feed: Omit<Feed, 'id'>): Promise<string> {
    const id = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullFeed: Feed = { ...feed, id };
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['feeds'], 'readwrite');
      const store = transaction.objectStore('feeds');
      const request = store.add(fullFeed);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getFeeds(): Promise<Feed[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['feeds'], 'readonly');
      const store = transaction.objectStore('feeds');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchArticles(query: string): Promise<Article[]> {
    const articles = await this.getArticles();
    const lowercaseQuery = query.toLowerCase();
    
    return articles.filter(article =>
      article.title.toLowerCase().includes(lowercaseQuery) ||
      article.content.toLowerCase().includes(lowercaseQuery) ||
      article.summary?.toLowerCase().includes(lowercaseQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const storageService = new StorageService();
export type { Feed, Article, Highlight };
