/**
 * PukiWiki to Markdown Converter
 */
export function pukiwikiToMarkdown(pwText: string): string {
  const lines = pwText.split('\n');
  const mdLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Block Elements

    // Headings
    if (line.startsWith('*')) {
      const match = line.match(/^(\*{1,3})\s*(.*?)\s*(\[#[a-zA-Z0-9]+\])?$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        line = '#'.repeat(level) + ' ' + text;
      }
    } 
    // Unordered Lists
    else if (line.match(/^---?/)) {
      if (line.startsWith('---')) {
        line = line.replace(/^---/, '    - ');
      } else if (line.startsWith('--')) {
        line = line.replace(/^--/, '  - ');
      } else if (line.startsWith('-')) {
        line = line.replace(/^-/, '- ');
      }
    }
    // Ordered Lists
    else if (line.match(/^\+\+\+?/)) {
      if (line.startsWith('+++')) {
        line = line.replace(/^\+\+\+/, '    1. ');
      } else if (line.startsWith('++')) {
        line = line.replace(/^\+\+/, '  1. ');
      } else if (line.startsWith('+')) {
        line = line.replace(/^\+/, '1. ');
      }
    }
    // Quotes
    else if (line.match(/^>>>?/)) {
      if (line.startsWith('>>>')) {
        line = line.replace(/^>>>/, '> > > ');
      } else if (line.startsWith('>>')) {
        line = line.replace(/^>>/, '> > ');
      } else if (line.startsWith('>')) {
        line = line.replace(/^>/, '> ');
      }
    }
    // Horizontal Rules
    else if (line.startsWith('----') || line === '#hr') {
      line = '---';
    }
    // Preformatted
    else if (line.startsWith(' ')) {
      line = '    ' + line.substring(1);
    }
    // Images (Simple #ref)
    else if (line.match(/^#ref\([^,]+\)$/)) {
      const match = line.match(/^#ref\(([^,]+)\)$/);
      if (match) {
        line = `![](${match[1]})`;
      }
    }
    // Tables
    else if (line.startsWith('|') && line.endsWith('|h')) {
      line = line.substring(0, line.length - 1); // Remove 'h'
      mdLines.push(line);
      
      // Calculate number of columns to generate the separator
      const cols = line.split('|').length - 2; // -2 for start/end pipes
      if (cols > 0) {
        let separator = '|';
        for (let j = 0; j < cols; j++) {
          separator += '---|';
        }
        line = separator;
      }
    }
    
    // 2. Inline Elements
    
    // Bold
    line = line.replace(/''(.*?)''/g, '**$1**');
    // Italic
    line = line.replace(/'''(.*?)'''/g, '*$1*');
    // Strikethrough
    line = line.replace(/%%(.*?)%%/g, '~~$1~~');
    
    // Links
    // [[Alias>URL]]
    line = line.replace(/\[\[(.*?)[>|:](.*?)\]\]/g, '[$1]($2)');
    // [[PageName]] or [[URL]]
    line = line.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      // If it looks like a URL, keep it as an autolink
      if (p1.startsWith('http')) {
        return `<${p1}>`;
      }
      return `[${p1}](${p1})`;
    });

    mdLines.push(line);
  }

  return mdLines.join('\n');
}

/**
 * Markdown to PukiWiki Converter
 */
export function markdownToPukiwiki(mdText: string): string {
  const lines = mdText.split('\n');
  const pwLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Table Separator (skip and modify previous line if needed)
    if (line.match(/^\|(?:---+\|)+$/)) {
      if (pwLines.length > 0) {
        const prev = pwLines[pwLines.length - 1];
        if (prev.startsWith('|') && prev.endsWith('|')) {
          pwLines[pwLines.length - 1] = prev + 'h';
        }
      }
      continue; // Skip the markdown separator row
    }

    // 1. Block Elements

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      line = '*'.repeat(level) + ' ' + text; // Note: added space after asterisks for readability, PW tolerates it or we can omit it. Let's omit it for strict Pukiwiki:
      line = '*'.repeat(level) + text;
    }
    // Unordered Lists
    else if (line.match(/^(    |  )?-\s+(.*)$/)) {
      const match = line.match(/^(    |  )?-\s+(.*)$/);
      if (match) {
        const indent = match[1] || '';
        let prefix = '-';
        if (indent === '  ') prefix = '--';
        else if (indent === '    ') prefix = '---';
        line = prefix + match[2];
      }
    }
    // Ordered Lists
    else if (line.match(/^(    |  )?\d+\.\s+(.*)$/)) {
      const match = line.match(/^(    |  )?\d+\.\s+(.*)$/);
      if (match) {
        const indent = match[1] || '';
        let prefix = '+';
        if (indent === '  ') prefix = '++';
        else if (indent === '    ') prefix = '+++';
        line = prefix + match[2];
      }
    }
    // Quotes
    else if (line.match(/^(> > >|> >|>)\s*(.*)$/)) {
      const match = line.match(/^(> > >|> >|>)\s*(.*)$/);
      if (match) {
        const prefixStr = match[1].replace(/ /g, ''); // Convert "> >" to ">>"
        line = prefixStr + match[2];
      }
    }
    // Horizontal Rules
    else if (line.match(/^---+$/)) {
      line = '----';
    }
    // Preformatted
    else if (line.startsWith('    ')) {
      line = ' ' + line.substring(4);
    }
    // Images
    else if (line.match(/!\[.*?\]\((.*?)\)/)) {
      line = line.replace(/!\[.*?\]\((.*?)\)/g, '#ref($1)');
    }

    // 2. Inline Elements
    
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '\'\'$1\'\'');
    // Italic
    line = line.replace(/\*(.*?)\*/g, '\'\'\'$1\'\'\'');
    // Strikethrough
    line = line.replace(/~~(.*?)~~/g, '%%$1%%');
    
    // Links
    // [Link Name](URL)
    line = line.replace(/\[(.*?)\]\((.*?)\)/g, '[[$1>$2]]');
    // <URL>
    line = line.replace(/<(http.*?)>/g, '[[$1]]');

    pwLines.push(line);
  }

  return pwLines.join('\n');
}
