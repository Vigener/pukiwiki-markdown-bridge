import EasyMDE from 'easymde';
import { pukiwikiToMarkdown, markdownToPukiwiki, validateMarkdown } from '../converter';
import * as Diff from 'diff';

document.addEventListener('DOMContentLoaded', async () => {
  const applyBtn = document.getElementById('apply-btn') as HTMLButtonElement;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
  const editPageBtn = document.getElementById('edit-page-btn') as HTMLButtonElement;
  const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;
  
  const draftBanner = document.getElementById('draft-banner') as HTMLDivElement;
  const draftDiffBtn = document.getElementById('draft-diff-btn') as HTMLButtonElement;
  const restoreBtn = document.getElementById('draft-restore-btn') as HTMLButtonElement;
  const discardBtn = document.getElementById('draft-discard-btn') as HTMLButtonElement;

  const diffModal = document.getElementById('diff-modal') as HTMLDivElement;
  const diffModalTitle = document.getElementById('diff-modal-title') as HTMLHeadingElement;
  const diffContent = document.getElementById('diff-content') as HTMLDivElement;
  const diffCancelBtn = document.getElementById('diff-cancel-btn') as HTMLButtonElement;
  const diffActionBtn = document.getElementById('diff-action-btn') as HTMLButtonElement;

  const validationModal = document.getElementById('validation-modal') as HTMLDivElement;
  const validationContent = document.getElementById('validation-content') as HTMLUListElement;
  const validationCancelBtn = document.getElementById('validation-cancel-btn') as HTMLButtonElement;
  const validationActionBtn = document.getElementById('validation-action-btn') as HTMLButtonElement;

  if (!applyBtn || !textarea) return;

  const DEFAULT_URLS = ['https://example.com/pukiwiki/?Your_Team/Your_Name*'];
  const items = await chrome.storage.sync.get({ 
    allowedUrls: DEFAULT_URLS,
    shortcutApply: true,
    diffConfirmMode: 'deletions_only'
  });
  const { allowedUrls, shortcutApply, diffConfirmMode } = items;

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const cmdKey = isMac ? '⌘+Enter' : 'Ctrl+Enter';
  const escKey = 'Esc';

  const optEnterKey = isMac ? '⌥+Enter' : 'Alt+Enter';
  const optShiftDKey = isMac ? '⌥+Shift+D' : 'Alt+Shift+D';
  const optBackspaceKey = isMac ? '⌥+Backspace' : 'Alt+Backspace';

  if (shortcutApply) {
    applyBtn.innerHTML += `<span class="shortcut-key">${cmdKey}</span>`;
    editPageBtn.innerHTML += `<span class="shortcut-key">${cmdKey}</span>`;
  }
  validationCancelBtn.innerHTML += `<span class="shortcut-key">${escKey}</span>`;
  validationActionBtn.innerHTML += `<span class="shortcut-key">${cmdKey}</span>`;
  diffCancelBtn.innerHTML += `<span class="shortcut-key">${escKey}</span>`;

  restoreBtn.innerHTML += `<span class="shortcut-key">${optEnterKey}</span>`;
  draftDiffBtn.innerHTML += `<span class="shortcut-key">${optShiftDKey}</span>`;
  discardBtn.innerHTML += `<span class="shortcut-key">${optBackspaceKey}</span>`;

  let modalActionCallback: (() => void) | null = null;
  const closeModal = () => {
    diffModal.style.display = 'none';
    validationModal.style.display = 'none';
    modalActionCallback = null;
  };
  
  diffCancelBtn.addEventListener('click', closeModal);
  diffActionBtn.addEventListener('click', () => {
    if (modalActionCallback) modalActionCallback();
  });

  validationCancelBtn.addEventListener('click', closeModal);
  validationActionBtn.addEventListener('click', () => {
    if (modalActionCallback) modalActionCallback();
  });

  if (allowedUrls.length === 1 && allowedUrls[0] === DEFAULT_URLS[0]) {
    chrome.runtime.openOptionsPage();
    window.close();
    return;
  }

  // Define custom comment toggle

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
  


  // Initialize EasyMDE
  const easyMDE = new EasyMDE({
    element: textarea,
    spellChecker: false,
    autofocus: true,
    status: false,
    toolbar: ['bold', 'italic', 'strikethrough', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', 'table', 'horizontal-rule', '|', 'guide']
  });

  // Apply custom keymaps directly to CodeMirror
  const extraKeys: Record<string, any> = {
    "Cmd-/": toggleComment,
    "Ctrl-/": toggleComment
  };

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
  let initialMdText = '';

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    currentTabUrl = tab.url || '';
    const showEditButton = () => {
      applyBtn.style.display = 'none';
      copyBtn.style.display = 'none';
      if (editPageBtn) {
        editPageBtn.style.display = 'block';
        editPageBtn.onclick = () => {
          let editUrl = currentTabUrl;
          try {
            const urlObj = new URL(currentTabUrl);
            if (urlObj.search) {
              if (!urlObj.search.includes('cmd=')) {
                const pageName = urlObj.search.substring(1);
                editUrl = `${urlObj.origin}${urlObj.pathname}?cmd=edit&page=${pageName}`;
              }
            } else {
              editUrl = `${urlObj.origin}${urlObj.pathname}?cmd=edit`;
            }
          } catch(e) {}
          
          if (tab && tab.id) {
            chrome.tabs.update(tab.id, { url: editUrl });
            window.close();
          }
        };
      }
      easyMDE.value('テキストエリアが見つかりませんでした。\n上部の「編集画面へ移動」ボタンを押して、編集ページへ移動してください。');
    };

    try {
      // Get PukiWiki text from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TEXT' });
      if (response && response.text !== undefined) {
        const mdText = pukiwikiToMarkdown(response.text);
        initialMdText = mdText;
        easyMDE.value(mdText);

        // Check for drafts
        if (currentTabUrl) {
          const draftKey = `draft_${currentTabUrl}`;
          const storageData = await chrome.storage.local.get(draftKey);
          const draftText = storageData[draftKey];
          
          if (draftText && draftText !== mdText) {
            draftBanner.style.display = 'flex';
            
            draftDiffBtn.onclick = () => {
              diffModalTitle.textContent = 'ドラフトとの差分';
              const diff = Diff.diffLines(mdText, draftText);
              diffContent.innerHTML = '';
              diff.forEach((part) => {
                const span = document.createElement('span');
                span.className = part.added ? 'diff-line diff-added' :
                                 part.removed ? 'diff-line diff-removed' :
                                 'diff-line diff-unchanged';
                span.textContent = part.value;
                diffContent.appendChild(span);
              });
              diffActionBtn.innerHTML = `復元する<span class="shortcut-key">${cmdKey}</span>`;
              modalActionCallback = () => {
                easyMDE.value(draftText);
                draftBanner.style.display = 'none';
                closeModal();
              };
              diffModal.style.display = 'flex';
            };

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
        showEditButton();
      }
    } catch (e) {
      console.warn('Error communicating with content script:', e);
      showEditButton();
    }
  }

  // Global shortcut for Cmd+Enter to confirm modal or apply
  // Also support Esc to cancel modals
  document.addEventListener('keydown', (e) => {
    // Draft Banner Shortcuts
    if (draftBanner.style.display === 'flex' && validationModal.style.display !== 'flex' && diffModal.style.display !== 'flex') {
      if (e.altKey && !e.shiftKey && e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        restoreBtn.click();
        return;
      }
      if (e.altKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        e.stopPropagation();
        draftDiffBtn.click();
        return;
      }
      if (e.altKey && !e.shiftKey && (e.code === 'Backspace' || e.code === 'Delete')) {
        e.preventDefault();
        e.stopPropagation();
        discardBtn.click();
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.code === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (validationModal.style.display === 'flex') {
        validationActionBtn.click();
      } else if (diffModal.style.display === 'flex') {
        diffActionBtn.click();
      } else if (shortcutApply) {
        if (applyBtn.style.display !== 'none') {
          applyBtn.click();
        } else if (editPageBtn.style.display !== 'none') {
          editPageBtn.click();
        }
      }
    } else if (e.code === 'Escape') {
      if (validationModal.style.display === 'flex' || diffModal.style.display === 'flex') {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      } else {
        // No modals open, close the popup
        e.preventDefault();
        e.stopPropagation();
        window.close();
      }
    }
  }, true); // Use capture phase to prevent double firing

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

  const performApply = async () => {
    if (!tab || !tab.id) return;
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
      console.warn('Error applying text:', e);
      alert('適用に失敗しました。');
    }
  };

  // Handle apply button
  applyBtn.addEventListener('click', async () => {
    const currentMdText = easyMDE.value();
    
    const validationErrors = validateMarkdown(currentMdText);
    
    const runDiffOrApply = () => {
      if (diffConfirmMode === 'none') {
        performApply();
        return;
      }
      
      const diff = Diff.diffLines(initialMdText, currentMdText);
      const hasDeletions = diff.some(part => part.removed);
      
      if (diffConfirmMode === 'always' || (diffConfirmMode === 'deletions_only' && hasDeletions)) {
        diffModalTitle.textContent = '反映する差分の確認';
        diffContent.innerHTML = '';
        diff.forEach((part) => {
          const span = document.createElement('span');
          span.className = part.added ? 'diff-line diff-added' :
                           part.removed ? 'diff-line diff-removed' :
                           'diff-line diff-unchanged';
          span.textContent = part.value;
          diffContent.appendChild(span);
        });
        diffActionBtn.innerHTML = `反映する<span class="shortcut-key">${cmdKey}</span>`;
        modalActionCallback = () => {
          closeModal();
          performApply();
        };
        diffModal.style.display = 'flex';
      } else {
        performApply();
      }
    };

    if (validationErrors.length > 0) {
      validationContent.innerHTML = '';
      validationErrors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        validationContent.appendChild(li);
      });
      modalActionCallback = () => {
        closeModal();
        runDiffOrApply();
      };
      validationModal.style.display = 'flex';
    } else {
      runDiffOrApply();
    }
  });
});
