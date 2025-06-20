
export class URLToMarkdownConverter {
  static async convertURL(url: string): Promise<{ markdown: string; title: string; metadata: any }> {
    try {
      // Note: In a real implementation, this would need a backend service
      // For demo purposes, we'll simulate the conversion
      const response = await fetch(url);
      const html = await response.text();
      return this.convertHTMLToMarkdown(html, url);
    } catch (error) {
      console.error('URL conversion failed:', error);
      return this.getDemoMarkdown(url);
    }
  }

  static convertHTMLToMarkdown(html: string, originalUrl: string): { markdown: string; title: string; metadata: any } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract metadata
    const title = doc.querySelector('title')?.textContent || 'Untitled Article';
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Remove scripts, styles, and navigation elements
    const elementsToRemove = ['script', 'style', 'nav', 'header', 'footer', '.advertisement', '.sidebar'];
    elementsToRemove.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Find main content (simplified heuristic)
    const contentSelectors = ['article', 'main', '.content', '.post', '.entry'];
    let mainContent = null;
    
    for (const selector of contentSelectors) {
      mainContent = doc.querySelector(selector);
      if (mainContent) break;
    }
    
    if (!mainContent) {
      mainContent = doc.body;
    }

    // Convert to markdown (simplified)
    const markdown = this.htmlToMarkdown(mainContent);
    
    const metadata = {
      title,
      author,
      description,
      url: originalUrl,
      extractedAt: new Date().toISOString()
    };

    return { markdown, title, metadata };
  }

  private static htmlToMarkdown(element: Element): string {
    let markdown = '';
    
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        markdown += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();
        
        switch (tagName) {
          case 'h1':
            markdown += `# ${el.textContent}\n\n`;
            break;
          case 'h2':
            markdown += `## ${el.textContent}\n\n`;
            break;
          case 'h3':
            markdown += `### ${el.textContent}\n\n`;
            break;
          case 'h4':
            markdown += `#### ${el.textContent}\n\n`;
            break;
          case 'h5':
            markdown += `##### ${el.textContent}\n\n`;
            break;
          case 'h6':
            markdown += `###### ${el.textContent}\n\n`;
            break;
          case 'p':
            markdown += `${el.textContent}\n\n`;
            break;
          case 'strong':
          case 'b':
            markdown += `**${el.textContent}**`;
            break;
          case 'em':
          case 'i':
            markdown += `*${el.textContent}*`;
            break;
          case 'a':
            const href = el.getAttribute('href') || '';
            markdown += `[${el.textContent}](${href})`;
            break;
          case 'img':
            const src = el.getAttribute('src') || '';
            const alt = el.getAttribute('alt') || '';
            markdown += `![${alt}](${src})\n\n`;
            break;
          case 'ul':
            markdown += this.processListItems(el, '-') + '\n';
            break;
          case 'ol':
            markdown += this.processListItems(el, '1.') + '\n';
            break;
          case 'blockquote':
            markdown += `> ${el.textContent}\n\n`;
            break;
          case 'code':
            markdown += `\`${el.textContent}\``;
            break;
          case 'pre':
            markdown += `\`\`\`\n${el.textContent}\n\`\`\`\n\n`;
            break;
          default:
            markdown += this.htmlToMarkdown(el);
        }
      }
    }
    
    return markdown;
  }

  private static processListItems(listElement: Element, marker: string): string {
    let markdown = '';
    const items = listElement.querySelectorAll('li');
    
    items.forEach((item, index) => {
      const itemMarker = marker === '1.' ? `${index + 1}.` : marker;
      markdown += `${itemMarker} ${item.textContent}\n`;
    });
    
    return markdown;
  }

  // Demo data for development
  private static getDemoMarkdown(url: string): { markdown: string; title: string; metadata: any } {
    const markdown = `# Sample Article from URL

This is a demonstration of how URL-to-Markdown conversion works in the ReadLater application.

## Key Features

The conversion process includes:

- **Automatic content extraction** from web pages
- **Metadata preservation** including title, author, and description
- **Clean markdown formatting** with proper heading structure
- **Image and link preservation** when possible

## How It Works

1. Fetch the webpage content
2. Parse and clean the HTML
3. Extract main content using heuristics
4. Convert to clean markdown format
5. Preserve important metadata

> This is a blockquote example to show formatting preservation.

### Code Example

\`\`\`javascript
const result = await URLToMarkdownConverter.convertURL(url);
console.log(result.markdown);
\`\`\`

For more information, visit the [original URL](${url}).

---

*Article extracted on ${new Date().toLocaleDateString()}*`;

    return {
      markdown,
      title: 'Sample Converted Article',
      metadata: {
        title: 'Sample Converted Article',
        author: 'Demo Author',
        description: 'A demonstration of URL-to-Markdown conversion',
        url,
        extractedAt: new Date().toISOString()
      }
    };
  }
}
