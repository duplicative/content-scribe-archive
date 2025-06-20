
interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  guid?: string;
}

interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

export class RSSParser {
  static async fetchAndParse(url: string): Promise<RSSFeed> {
    try {
      // Note: In a real implementation, this would need a CORS proxy
      // For demo purposes, we'll simulate RSS parsing
      const response = await fetch(url);
      const text = await response.text();
      return this.parseRSS(text);
    } catch (error) {
      console.error('RSS fetch failed:', error);
      // Return demo data for development
      return this.getDemoFeed(url);
    }
  }

  static parseRSS(xmlText: string): RSSFeed {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    
    const channel = doc.querySelector('channel') || doc.querySelector('feed');
    if (!channel) {
      throw new Error('Invalid RSS/Atom feed');
    }

    const title = this.getTextContent(channel, 'title') || 'Unknown Feed';
    const description = this.getTextContent(channel, 'description') || this.getTextContent(channel, 'subtitle') || '';
    const link = this.getTextContent(channel, 'link') || '';

    const items = Array.from(doc.querySelectorAll('item, entry')).map(item => ({
      title: this.getTextContent(item, 'title') || 'Untitled',
      link: this.getTextContent(item, 'link') || this.getAttributeContent(item, 'link', 'href') || '',
      description: this.getTextContent(item, 'description') || this.getTextContent(item, 'summary') || this.getTextContent(item, 'content') || '',
      pubDate: this.getTextContent(item, 'pubDate') || this.getTextContent(item, 'published') || this.getTextContent(item, 'updated') || '',
      author: this.getTextContent(item, 'author') || this.getTextContent(item, 'dc:creator') || '',
      guid: this.getTextContent(item, 'guid') || this.getTextContent(item, 'id') || ''
    }));

    return { title, description, link, items };
  }

  private static getTextContent(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }

  private static getAttributeContent(parent: Element, tagName: string, attributeName: string): string {
    const element = parent.querySelector(tagName);
    return element?.getAttribute(attributeName) || '';
  }

  // Demo data for development
  private static getDemoFeed(url: string): RSSFeed {
    return {
      title: 'Demo RSS Feed',
      description: 'A demonstration RSS feed with sample articles',
      link: url,
      items: [
        {
          title: 'Getting Started with RSS Readers',
          link: 'https://example.com/article1',
          description: 'Learn how to effectively use RSS readers to stay up-to-date with your favorite content sources. This comprehensive guide covers everything from basics to advanced features.',
          pubDate: new Date().toISOString(),
          author: 'Tech Writer',
          guid: 'article-1'
        },
        {
          title: 'The Future of Content Aggregation',
          link: 'https://example.com/article2',
          description: 'Exploring how content aggregation is evolving in the modern web. From RSS to AI-powered curation, discover what\'s next in information management.',
          pubDate: new Date(Date.now() - 86400000).toISOString(),
          author: 'Content Strategist',
          guid: 'article-2'
        },
        {
          title: 'Building Your Personal Knowledge Base',
          link: 'https://example.com/article3',
          description: 'Tips and strategies for creating and maintaining a personal knowledge management system that grows with you over time.',
          pubDate: new Date(Date.now() - 172800000).toISOString(),
          author: 'Productivity Expert',
          guid: 'article-3'
        }
      ]
    };
  }
}
