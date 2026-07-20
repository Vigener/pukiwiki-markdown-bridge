/**
 * PukiWiki to Markdown Converter
 */
export function pukiwikiToMarkdown(pwText: string): string {
  const lines = pwText.split('\n');
  const mdLines: string[] = [];
  let inTable = false;
  const olCounters = new Array(10).fill(0);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let isTableLine = false;
    let tableSeparator = '';

    // 1. Block Elements

    // Headings
    if (line.startsWith('*')) {
      const match = line.match(/^(\*{1,3})(\s*)(.*)$/);
      if (match) {
        const level = match[1].length;
        const noSpace = match[2] === '' ? ' <!--nospace-->' : '';
        const text = match[3];
        line = '#'.repeat(level) + ' ' + text + noSpace;
      }
    } 
    // Horizontal Rules
    else if (line.match(/^----+\s*$/) || line === '#hr') {
      const match = line.match(/^(----+)/);
      if (match) {
        line = match[1];
      } else if (line === '#hr') {
        line = '---';
      }
    }
    // Unordered Lists
    else if (line.match(/^(-+)(\s*)(.*)$/)) {
      const match = line.match(/^(-+)(\s*)(.*)$/);
      if (match) {
        const depth = match[1].length;
        const noSpace = match[2] === '' ? ' <!--nospace-->' : '';
        const indent = '  '.repeat(depth - 1);
        line = indent + '- ' + match[3] + noSpace;
        olCounters.fill(0);
      }
    }
    // Ordered Lists
    else if (line.match(/^(\++)(\s*)(.*)$/)) {
      const match = line.match(/^(\++)(\s*)(.*)$/);
      if (match) {
        const depth = match[1].length;
        const noSpace = match[2] === '' ? ' <!--nospace-->' : '';
        const indent = '  '.repeat(depth - 1);
        olCounters[depth - 1]++;
        olCounters.fill(0, depth);
        line = indent + `${olCounters[depth - 1]}. ` + match[3] + noSpace;
      }
    }
    // Quotes
    else if (line.match(/^>{1,3}/)) {
      const match = line.match(/^(>{1,3})(\s*)(.*)$/);
      if (match) {
        const level = match[1].length;
        const noSpace = match[2] === '' ? ' <!--nospace-->' : '';
        const text = match[3];
        const prefix = '> '.repeat(level);
        line = prefix + text + noSpace;
      }
    }
    // Comments
    else if (line.startsWith('//')) {
      const commentText = line.substring(2);
      line = `<!--${commentText}-->`;
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
        if (!hasOptions && alt === '') {
          line = `![${alt}](${file})`;
        } else {
          line = `![${alt}](${file})<!--#ref(${match[1]})-->`;
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
      
      line = line + (option ? ` <!--${option}-->` : '');
      isTableLine = true;
      
      if (!inTable) {
        inTable = true;
        const cols = line.split('|').length - 2;
        if (cols > 0) {
          tableSeparator = '|';
          for (let j = 0; j < cols; j++) {
            tableSeparator += '---|';
          }
        }
      }
      olCounters.fill(0);
    }
    else {
      inTable = false;
      // Regular text or empty line, reset ordered list counters
      if (!line.match(/^-{1,3}/)) {
        olCounters.fill(0);
      }
    }
    
    // 2. Inline Elements
    
    // Escape literal asterisks and tildes first
    line = line.replace(/\*/g, '\\*');
    line = line.replace(/~/g, '\\~');
    
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
      
      if (!hasOptions && alt === '') {
        return `![${alt}](${file})`;
      }
      return `![${alt}](${file})<!--&ref(${inner})-->`;
    });
    
    // Italic
    line = line.replace(/'''(.*?)'''/g, '*$1*');
    // Bold
    line = line.replace(/''(.*?)''/g, '**$1**');
    // Strikethrough
    line = line.replace(/%%(.*?)%%/g, '~~$1~~');
    
    // [[Alias>URL]] or [[Alias:URL]]
    line = line.replace(/\[\[(.*?)([>|:])(.*?)\]\]/g, (match, p1, sep, p2) => {
      if (sep === ':') return `[${p1}](${p2})<!--:-->`;
      return `[${p1}](${p2})`;
    });
    // [[PageName]] or [[URL]]
    line = line.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
      // If it looks like a URL, keep it as an autolink
      if (p1.startsWith('http')) {
        return `<${p1}>`;
      }
      return `[${p1}](./${p1})<!--PW_LINK-->`;
    });

    mdLines.push(line);
    if (isTableLine && tableSeparator) {
      mdLines.push(tableSeparator);
    }
  }

  return mdLines.join('\n');
}

/**
 * Markdown to PukiWiki Converter
 */
export function markdownToPukiwiki(mdText: string): string {
  const lines = mdText.split('\n');
  const pwLines: string[] = [];

  let listIndentStack: number[] = [0];
  let lastWasList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let isList = false;

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
      // PukiWiki treats the second argument of ref() as a pagename historically.
      // Passing alt text like ref(file.jpg, alt) causes an "obsolete" error.
      // To prevent this, we simply drop the alt text in the generic fallback.
      // We also use &ref() instead of #ref() because Markdown images can be inline.
      return `&ref(${file});`;
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
    line = line.replace(/(?<!\\)\*\*(?!\s)(.+?)(?<!\s)(?<!\\)\*\*/g, "''$1''");
    line = line.replace(/(?<![A-Za-z0-9\\])__(?!\s)(.+?)(?<!\s)(?<!\\)__(?![A-Za-z0-9])/g, "''$1''");
    // Italic
    line = line.replace(/(?<!\\)\*(?!\s)(.+?)(?<!\s)(?<!\\)\*/g, "'''$1'''");
    line = line.replace(/(?<![A-Za-z0-9\\])_(?!\s)(.+?)(?<!\s)(?<!\\)_(?![A-Za-z0-9])/g, "'''$1'''");
    // Strikethrough
    line = line.replace(/~~(.+?)~~/g, '%%$1%%');

    // Unescape literal asterisks and tildes
    line = line.replace(/\\\*/g, '*');
    line = line.replace(/\\~/g, '~');
    
    // Obsidian-style WikiLinks in Markdown (one-way Markdown to PukiWiki)
    line = line.replace(/\[\[(.*?)\]\]/g, (match, text) => {
      if (text.includes('>') || text.includes(':')) return match;
      return `[[${text}>./${text}]]`;
    });

    // Links
    // [[Alias>URL]] or [[Alias:URL]] or [[Alias]]
    line = line.replace(/\[(.*?)\]\((.*?)\)(<!--:-->)?(<!--PW_LINK-->)?/g, (match, text, url, colon, pwLink) => {
      if (pwLink) return `[[${text}]]`;
      if (colon) return `[[${text}:${url}]]`;
      return `[[${text}>${url}]]`;
    });
    // <URL>
    line = line.replace(/<(http.*?)>/g, '[[$1]]');

    // 2. Block Elements

    // Preformatted
    if (line.startsWith('    ')) {
      line = ' ' + line.substring(4);
      pwLines.push(line);
      lastWasList = false;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      let text = headingMatch[2];
      let noSpace = false;
      if (text === '<!--nospace-->' || text.endsWith(' <!--nospace-->')) {
        noSpace = true;
        text = text.replace(/ ?<!--nospace-->$/, '');
      }
      line = '*'.repeat(level) + (noSpace ? '' : ' ') + text;
    }
    // Horizontal Rules
    else if (line.match(/^(\s*[-*_]\s*){3,}$/)) {
      const count = line.replace(/[^-_*]/g, '').length;
      line = '-'.repeat(Math.max(4, count));
    }
    // Unordered Lists
    else if (line.match(/^(\s*)-\s+(.*)$/)) {
      isList = true;
      if (!lastWasList) listIndentStack = [0];
      
      const match = line.match(/^(\s*)-\s+(.*)$/);
      if (match) {
        const indentStr = match[1] || '';
        let spaces = 0;
        for (const c of indentStr) {
          spaces += c === '\t' ? 4 : 1;
        }
        
        while (listIndentStack.length > 1 && spaces <= listIndentStack[listIndentStack.length - 2]) {
          listIndentStack.pop();
        }
        if (spaces > listIndentStack[listIndentStack.length - 1]) {
          listIndentStack.push(spaces);
        } else if (spaces < listIndentStack[listIndentStack.length - 1]) {
          listIndentStack[listIndentStack.length - 1] = spaces;
        }

        let text = match[2];
        let noSpace = false;
        if (text === '<!--nospace-->' || text.endsWith(' <!--nospace-->')) {
          noSpace = true;
          text = text.replace(/ ?<!--nospace-->$/, '');
        }
        
        const depth = Math.min(3, listIndentStack.length);
        line = '-'.repeat(depth) + (noSpace ? '' : ' ') + text;
      }
    }
    // Ordered Lists
    else if (line.match(/^(\s*)\d+\.\s+(.*)$/)) {
      isList = true;
      if (!lastWasList) listIndentStack = [0];

      const match = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (match) {
        const indentStr = match[1] || '';
        let spaces = 0;
        for (const c of indentStr) {
          spaces += c === '\t' ? 4 : 1;
        }

        while (listIndentStack.length > 1 && spaces <= listIndentStack[listIndentStack.length - 2]) {
          listIndentStack.pop();
        }
        if (spaces > listIndentStack[listIndentStack.length - 1]) {
          listIndentStack.push(spaces);
        } else if (spaces < listIndentStack[listIndentStack.length - 1]) {
          listIndentStack[listIndentStack.length - 1] = spaces;
        }

        let text = match[2];
        let noSpace = false;
        if (text === '<!--nospace-->' || text.endsWith(' <!--nospace-->')) {
          noSpace = true;
          text = text.replace(/ ?<!--nospace-->$/, '');
        }

        const depth = Math.min(3, listIndentStack.length);
        line = '+'.repeat(depth) + (noSpace ? '' : ' ') + text;
      }
    }
    // Quotes
    else if (line.match(/^(> > >|> >|>)\s*(.*)$/)) {
      const match = line.match(/^(> > >|> >|>)\s*(.*)$/);
      if (match) {
        const prefixStr = match[1].replace(/ /g, ''); // Convert "> >" to ">>"
        let text = match[2];
        let noSpace = false;
        if (text === '<!--nospace-->' || text.endsWith(' <!--nospace-->')) {
          noSpace = true;
          text = text.replace(/ ?<!--nospace-->$/, '');
        }
        line = prefixStr + (noSpace ? '' : ' ') + text;
      }
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

    if (isList) {
      lastWasList = true;
    } else if (line.trim() !== '' && !line.startsWith('//')) {
      lastWasList = false;
    }

    pwLines.push(line);
  }

  return pwLines.join('\n');
}


/**
 * Validate Markdown for features unsupported by PukiWiki
 */
export function validateMarkdown(mdText: string): string[] {
  const errors: string[] = [];
  const lines = mdText.split('\n');
  
  let listIndentStack: number[] = [0];
  let lastWasList = false;
  let hasDepth4 = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let isList = false;

    // Unordered Lists
    if (line.match(/^(\s*)-\s+(.*)$/)) {
      isList = true;
      if (!lastWasList) listIndentStack = [0];
      const match = line.match(/^(\s*)-\s+(.*)$/);
      if (match) {
        let spaces = 0;
        for (const c of (match[1] || '')) spaces += c === '\t' ? 4 : 1;
        while (listIndentStack.length > 1 && spaces <= listIndentStack[listIndentStack.length - 2]) listIndentStack.pop();
        if (spaces > listIndentStack[listIndentStack.length - 1]) listIndentStack.push(spaces);
        else if (spaces < listIndentStack[listIndentStack.length - 1]) listIndentStack[listIndentStack.length - 1] = spaces;
        if (listIndentStack.length > 3) hasDepth4 = true;
      }
    }
    // Ordered Lists
    else if (line.match(/^(\s*)\d+\.\s+(.*)$/)) {
      isList = true;
      if (!lastWasList) listIndentStack = [0];
      const match = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (match) {
        let spaces = 0;
        for (const c of (match[1] || '')) spaces += c === '\t' ? 4 : 1;
        while (listIndentStack.length > 1 && spaces <= listIndentStack[listIndentStack.length - 2]) listIndentStack.pop();
        if (spaces > listIndentStack[listIndentStack.length - 1]) listIndentStack.push(spaces);
        else if (spaces < listIndentStack[listIndentStack.length - 1]) listIndentStack[listIndentStack.length - 1] = spaces;
        if (listIndentStack.length > 3) hasDepth4 = true;
      }
    }

    if (isList) lastWasList = true;
    else if (line.trim() !== '' && !line.startsWith('//')) lastWasList = false;
  }

  if (hasDepth4) {
    errors.push('箇条書きのネスト（深さ4以上）: PukiWikiは深さ3までしか対応していません。そのまま反映すると深さ3に丸められます。');
  }

  return errors;
}
