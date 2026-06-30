/**
 * PukiWiki to Markdown Converter
 */
export function pukiwikiToMarkdown(pwText: string): string {
  const lines = pwText.split('\n');
  const mdLines: string[] = [];
  let inTable = false;
  const olCounters = [0, 0, 0, 0];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Block Elements

    // Headings
    if (line.startsWith('*')) {
      const match = line.match(/^(\*{1,3})\s*(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        line = '#'.repeat(level) + ' ' + text;
      }
    } 
    // Unordered Lists
    else if (line.match(/^(-+)\s*(.*)$/)) {
      const match = line.match(/^(-+)\s*(.*)$/);
      if (match) {
        const depth = match[1].length;
        const indent = '    '.repeat(depth - 1);
        line = indent + '- ' + match[2];
        olCounters.fill(0);
      }
    }
    // Ordered Lists
    else if (line.match(/^(\++)\s*(.*)$/)) {
      const match = line.match(/^(\++)\s*(.*)$/);
      if (match) {
        const depth = match[1].length;
        const indent = '    '.repeat(depth - 1);
        olCounters[depth - 1]++;
        olCounters.fill(0, depth);
        line = indent + `${olCounters[depth - 1]}. ` + match[2];
      }
    }
    // Quotes
    else if (line.match(/^>{1,3}/)) {
      const match = line.match(/^(>{1,3})\s*(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const prefix = '> '.repeat(level);
        line = prefix + text;
      }
    }
    // Comments
    else if (line.startsWith('//')) {
      const commentText = line.substring(2);
      line = `<!--${commentText}-->`;
    }
    // Horizontal Rules
    else if (line.match(/^----/) || line === '#hr') {
      const match = line.match(/^(----+)/);
      if (match) {
        line = match[1];
      } else if (line === '#hr') {
        line = '---';
      }
    }
    // Preformatted
    else if (line.startsWith(' ')) {
      line = '    ' + line.substring(1);
      olCounters.fill(0); // reset on non-list
    }
    // Images (Complex #ref)
    else if (line.match(/^#ref\((.+?)\)$/)) {
      const match = line.match(/^#ref\((.+?)\)$/);
      if (match) {
        const args = match[1].split(',').map(s => s.trim());
        const file = args[0];
        let alt = '';
        let hasOptions = false;
        if (args.length > 1) {
          const lastArg = args[args.length - 1];
          const isAltText = (arg: string) => {
            const known = ['left', 'center', 'right', 'wrap', 'nowrap', 'around', 'nolink'];
            if (known.includes(arg)) return false;
            if (/^\d+x\d+$/.test(arg)) return false;
            if (/^\d+%$/.test(arg)) return false;
            return true;
          };
          if (isAltText(lastArg)) {
            alt = lastArg;
            if (args.length > 2) hasOptions = true;
          } else {
            hasOptions = true;
          }
        }
        
        if (hasOptions) {
          line = `![${alt}](${file})<!--#ref(${match[1]})-->`;
        } else {
          line = `![${alt}](${file})`;
        }
      }
      olCounters.fill(0);
    }
    // Tables
    else if (line.startsWith('|') && (line.endsWith('|') || line.match(/\|[hfc]+$/))) {
      let option = '';
      const optMatch = line.match(/\|([hfc]+)$/);
      if (optMatch) {
        option = optMatch[1];
        line = line.substring(0, line.length - option.length);
      }
      
      mdLines.push(line + (option ? ` <!--${option}-->` : ''));
      
      if (!inTable) {
        inTable = true;
        const cols = line.split('|').length - 2;
        if (cols > 0) {
          let separator = '|';
          for (let j = 0; j < cols; j++) {
            separator += '---|';
          }
          mdLines.push(separator);
        }
      }
      olCounters.fill(0);
      continue;
    }
    else {
      inTable = false;
      // Regular text or empty line, reset ordered list counters
      if (!line.match(/^-{1,3}/)) {
        olCounters.fill(0);
      }
    }
    
    // 2. Inline Elements
    
    // Line breaks (&br; and ~)
    line = line.replace(/&br;/g, '<br>');
    if (line.endsWith('~') && !line.endsWith('\\~')) {
      line = line.substring(0, line.length - 1) + '  ';
    }

    // Color
    line = line.replace(/&color\(([^,)]+)(?:,([^)]+))?\){(.*?)\};?/g, (match, fg, bg, text) => {
      let style = `color: ${fg};`;
      if (bg) style += ` background-color: ${bg};`;
      return `<span style="${style}">${text}</span>`;
    });

    // Size
    line = line.replace(/&size\(([^)]+)\){(.*?)\};?/g, (match, size, text) => {
      return `<span style="font-size: ${size}px;">${text}</span>`;
    });

    // Images (Complex &ref)
    line = line.replace(/&ref\((.+?)\);?/g, (match, inner) => {
      const args = inner.split(',').map(s => s.trim());
      const file = args[0];
      let alt = '';
      let hasOptions = false;
      if (args.length > 1) {
        const lastArg = args[args.length - 1];
        const isAltText = (arg: string) => {
          const known = ['nolink'];
          if (known.includes(arg)) return false;
          if (/^\d+x\d+$/.test(arg)) return false;
          if (/^\d+%$/.test(arg)) return false;
          return true;
        };
        if (isAltText(lastArg)) {
          alt = lastArg;
          if (args.length > 2) hasOptions = true;
        } else {
          hasOptions = true;
        }
      }
      
      if (hasOptions) {
        return `![${alt}](${file})<!--&ref(${inner})-->`;
      } else {
        return `![${alt}](${file})`;
      }
    });
    
    // Italic
    line = line.replace(/'''(.*?)'''/g, '*$1*');
    // Bold
    line = line.replace(/''(.*?)''/g, '**$1**');
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

    // Table Separator (skip)
    if (line.match(/^\|(?:\s*[:-]+\s*\|)+$/)) {
      continue; // Skip the markdown separator row
    }

    // 1. Inline Elements
    // Process these first so that block prefixes (like `***` for headings) don't get accidentally converted by italic/bold rules.
    
    // Line breaks
    line = line.replace(/<br>/g, '&br;');
    if (line.endsWith('  ')) {
      line = line.substring(0, line.length - 2) + '~';
    }

    // Images with original PukiWiki options
    // ![alt](file)<!--#ref(...)-->
    line = line.replace(/!\[(.*?)\]\((.*?)\)<!--#ref\((.+?)\)-->/g, (match, alt, file, originalArgs) => {
      const args = originalArgs.split(',').map(s => s.trim());
      args[0] = file;
      if (args.length > 1) {
        const lastArg = args[args.length - 1];
        const isAltText = (arg: string) => {
          const known = ['left', 'center', 'right', 'wrap', 'nowrap', 'around', 'nolink'];
          if (known.includes(arg)) return false;
          if (/^\d+x\d+$/.test(arg)) return false;
          if (/^\d+%$/.test(arg)) return false;
          return true;
        };
        if (isAltText(lastArg)) {
          if (alt) args[args.length - 1] = alt;
          else args.pop();
        } else if (alt) {
          args.push(alt);
        }
      } else if (alt) {
         args.push(alt);
      }
      return `#ref(${args.join(',')})`;
    });

    // Images with original PukiWiki options (&ref)
    line = line.replace(/!\[(.*?)\]\((.*?)\)<!--&ref\((.+?)\)-->/g, (match, alt, file, originalArgs) => {
      const args = originalArgs.split(',').map(s => s.trim());
      args[0] = file;
      if (args.length > 1) {
        const lastArg = args[args.length - 1];
        const isAltText = (arg: string) => {
          const known = ['nolink'];
          if (known.includes(arg)) return false;
          if (/^\d+x\d+$/.test(arg)) return false;
          if (/^\d+%$/.test(arg)) return false;
          return true;
        };
        if (isAltText(lastArg)) {
          if (alt) args[args.length - 1] = alt;
          else args.pop();
        } else if (alt) {
          args.push(alt);
        }
      } else if (alt) {
         args.push(alt);
      }
      return `&ref(${args.join(',')});`;
    });

    // Generic Images fallback
    line = line.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, file) => {
      if (alt) {
        return `#ref(${file},${alt})`;
      }
      return `#ref(${file})`;
    });

    // Color
    line = line.replace(/<span style="color:\s*([^;]+);(?:\s*background-color:\s*([^;]+);)?\s*">(.*?)<\/span>/g, (match, fg, bg, text) => {
      if (bg) {
        return `&color(${fg},${bg}){${text}};`;
      }
      return `&color(${fg}){${text}};`;
    });
    
    // Size
    line = line.replace(/<span style="font-size:\s*([^p]+)px;\s*">(.*?)<\/span>/g, (match, size, text) => {
      return `&size(${size}){${text}};`;
    });

    // Bold
    // Use .+? to avoid matching empty strings which caused the `''''''` issue
    line = line.replace(/\*\*(.+?)\*\*/g, '\'\'$1\'\'');
    
    // Italic
    line = line.replace(/\*(.+?)\*/g, '\'\'\'$1\'\'\'');
    
    // Strikethrough
    line = line.replace(/~~(.+?)~~/g, '%%$1%%');
    
    // Links
    // [[WikiLink]] (Obsidian style)
    line = line.replace(/\[\[(.*?)\]\]/g, '[[$1>./$1]]');
    // [Link Name](URL)
    line = line.replace(/\[(.*?)\]\((.*?)\)/g, '[[$1>$2]]');
    // <URL>
    line = line.replace(/<(http.*?)>/g, '[[$1]]');

    // 2. Block Elements

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      line = '*'.repeat(level) + ' ' + text;
    }
    // Unordered Lists
    else if (line.match(/^(\s*)-\s+(.*)$/)) {
      const match = line.match(/^(\s*)-\s+(.*)$/);
      if (match) {
        const indentStr = match[1] || '';
        let spaces = 0;
        for (const c of indentStr) {
          spaces += c === '\t' ? 4 : 1;
        }
        const depth = spaces >= 6 ? 3 : spaces >= 2 ? 2 : 1;
        line = '-'.repeat(depth) + ' ' + match[2];
      }
    }
    // Ordered Lists
    else if (line.match(/^(\s*)\d+\.\s+(.*)$/)) {
      const match = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (match) {
        const indentStr = match[1] || '';
        let spaces = 0;
        for (const c of indentStr) {
          spaces += c === '\t' ? 4 : 1;
        }
        const depth = spaces >= 6 ? 3 : spaces >= 2 ? 2 : 1;
        line = '+'.repeat(depth) + ' ' + match[2];
      }
    }
    // Quotes
    else if (line.match(/^(> > >|> >|>)\s*(.*)$/)) {
      const match = line.match(/^(> > >|> >|>)\s*(.*)$/);
      if (match) {
        const prefixStr = match[1].replace(/ /g, ''); // Convert "> >" to ">>"
        line = prefixStr + ' ' + match[2];
      }
    }
    // Horizontal Rules
    else if (line.match(/^[-*_]{3,}\s*$/)) {
      const count = line.replace(/[^-_*]/g, '').length;
      line = '-'.repeat(Math.max(4, count));
    }
    // Preformatted
    else if (line.startsWith('    ')) {
      line = ' ' + line.substring(4);
    }
    // Comments
    else if (line.match(/^<!--(.*)-->$/)) {
      const match = line.match(/^<!--(.*)-->$/);
      if (match) {
        line = '//' + match[1];
      }
    }
    // Table Options
    else if (line.startsWith('|') && line.match(/\| <!--([hfc]+)-->$/)) {
      const optMatch = line.match(/\| <!--([hfc]+)-->$/);
      if (optMatch) {
        line = line.substring(0, line.length - optMatch[0].length) + '|' + optMatch[1];
      }
    }

    pwLines.push(line);
  }

  return pwLines.join('\n');
}

