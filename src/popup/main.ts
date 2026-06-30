import EasyMDE from 'easymde';
import { pukiwikiToMarkdown, markdownToPukiwiki } from '../converter';

document.addEventListener('DOMContentLoaded', async () => {
  const applyBtn = document.getElementById('apply-btn') as HTMLButtonElement;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
  const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
  
  const draftBanner = document.getElementById('draft-banner') as HTMLDivElement;
  const restoreBtn = document.getElementById('draft-restore-btn') as HTMLButtonElement;
  const discardBtn = document.getElementById('draft-discard-btn') as HTMLButtonElement;

  if (!applyBtn || !textarea) return;

  const DEFAULT_URLS = ['https://example.com/pukiwiki/?Your_Team/Your_Name*'];
  const items = await chrome.storage.sync.get({ 
    allowedUrls: DEFAULT_URLS,
    shortcutApply: true 
  });
  const { allowedUrls, shortcutApply } = items;

  if (allowedUrls.length === 1 && allowedUrls[0] === DEFAULT_URLS[0]) {
    chrome.runtime.openOptionsPage();
    window.close();
    return;
  }

  // Define custom shortcuts
  const customShortcuts = {};
  if (shortcutApply) {
    customShortcuts["Cmd-Enter"] = () => applyBtn.click();
    customShortcuts["Ctrl-Enter"] = () => applyBtn.click();
  }

  // Custom comment toggle
  const toggleComment = (cm: any) => {
    const selections = cm.listSelections();
    cm.operation(() => {
      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i];
        const startLine = Math.min(sel.anchor.line, sel.head.line);
        const endLine = Math.max(sel.anchor.line, sel.head.line);
        
        let allCommented = true;
        for (let j = startLine; j <= endLine; j++) {
          if (!cm.getLine(j).match(/^<!--.*-->$/)) {
            allCommented = false;
            break;
          }
        }
        
        for (let j = startLine; j <= endLine; j++) {
          let text = cm.getLine(j);
          if (allCommented) {
            text = text.replace(/^<!--\s?(.*?)\s?-->$/, '$1');
          } else {
            text = `<!-- ${text} -->`;
          }
          cm.replaceRange(text, {line: j, ch: 0}, {line: j, ch: cm.getLine(j).length});
        }
      }
    });
  };
  
  customShortcuts["Cmd-/"] = toggleComment;
  customShortcuts["Ctrl-/"] = toggleComment;

  // Initialize EasyMDE
  const easyMDE = new EasyMDE({
    element: textarea,
    spellChecker: false,
    autofocus: true,
    status: false,
    toolbar: ['bold', 'italic', 'strikethrough', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', 'table', 'horizontal-rule', '|', 'preview', 'side-by-side', 'fullscreen', '|', 'guide']
  });

  // Apply custom keymaps directly to CodeMirror
  const extraKeys: Record<string, any> = {
    "Cmd-/": toggleComment,
    "Ctrl-/": toggleComment
  };
  
  if (shortcutApply) {
    extraKeys["Cmd-Enter"] = () => applyBtn.click();
    extraKeys["Ctrl-Enter"] = () => applyBtn.click();
  }

  const existingKeys = easyMDE.codemirror.getOption("extraKeys") || {};
  easyMDE.codemirror.setOption("extraKeys", { ...existingKeys, ...extraKeys });

  // Handle Copy
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(easyMDE.value());
    
    // Quick feedback animation
    const svg = copyBtn.querySelector('svg');
    if (svg) {
      svg.style.stroke = '#27ae60';
      setTimeout(() => { svg.style.stroke = 'currentColor'; }, 1000);
    }
  });

  let currentTabUrl = '';

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    currentTabUrl = tab.url || '';
    try {
      // Get PukiWiki text from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TEXT' });
      if (response && response.text !== undefined) {
        const mdText = pukiwikiToMarkdown(response.text);
        easyMDE.value(mdText);

        // Check for drafts
        if (currentTabUrl) {
          const draftKey = `draft_${currentTabUrl}`;
          const storageData = await chrome.storage.local.get(draftKey);
          const draftText = storageData[draftKey];
          
          if (draftText && draftText !== mdText) {
            draftBanner.style.display = 'flex';
            
            restoreBtn.onclick = () => {
              easyMDE.value(draftText);
              draftBanner.style.display = 'none';
            };
            
            discardBtn.onclick = () => {
              chrome.storage.local.remove(draftKey);
              draftBanner.style.display = 'none';
            };
          }
        }

      } else {
        easyMDE.value('テキストエリアが見つかりませんでした。');
      }
    } catch (e) {
      console.error('Error communicating with content script:', e);
      easyMDE.value('通信エラー。ページをリロードして再試行してください。');
    }
  }

  // Auto-save Draft
  let draftTimeout: any;
  easyMDE.codemirror.on('change', () => {
    if (!currentTabUrl) return;
    clearTimeout(draftTimeout);
    draftTimeout = setTimeout(() => {
      const draftKey = `draft_${currentTabUrl}`;
      chrome.storage.local.set({ [draftKey]: easyMDE.value() });
    }, 500);
  });

  // Handle apply button
  applyBtn.addEventListener('click', async () => {
    if (tab && tab.id) {
      const mdText = easyMDE.value();
      const pwText = markdownToPukiwiki(mdText);
      
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'SET_TEXT', text: pwText });
        // Clear draft on successful apply
        if (currentTabUrl) {
          await chrome.storage.local.remove(`draft_${currentTabUrl}`);
        }
        window.close(); // Close popup after applying
      } catch (e) {
        console.error('Error applying text:', e);
        alert('適用に失敗しました。');
      }
    }
  });
});
