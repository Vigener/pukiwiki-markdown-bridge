const DEFAULT_URLS = [
  'https://example.com/pukiwiki/?Your_Team/Your_Name*'
];

document.addEventListener('DOMContentLoaded', () => {
  const allowedUrlsEl = document.getElementById('allowedUrls') as HTMLTextAreaElement;
  const shortcutApplyEl = document.getElementById('shortcutApply') as HTMLInputElement;
  const diffConfirmModeEl = document.getElementById('diffConfirmMode') as HTMLSelectElement;
  const markdownRoundtripCheckEl = document.getElementById('markdownRoundtripCheck') as HTMLInputElement;
  const dateLinkFormatEl = document.getElementById('dateLinkFormat') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;

  // Template UI elements
  const templateListEl = document.getElementById('templateList') as HTMLDivElement;
  const templateFormTitleEl = document.getElementById('templateFormTitle') as HTMLHeadingElement;
  const editTemplateIdEl = document.getElementById('editTemplateId') as HTMLInputElement;
  const templateTitleEl = document.getElementById('templateTitle') as HTMLInputElement;
  const templateContentEl = document.getElementById('templateContent') as HTMLTextAreaElement;
  const saveTemplateBtn = document.getElementById('saveTemplateBtn') as HTMLButtonElement;
  const cancelTemplateBtn = document.getElementById('cancelTemplateBtn') as HTMLButtonElement;

  interface Template {
    id: string;
    title: string;
    content: string;
  }
  let templates: Template[] = [];

  // Load existing rules
  chrome.storage.sync.get({ 
    allowedUrls: DEFAULT_URLS,
    shortcutApply: true,
    diffConfirmMode: 'deletions_only',
    markdownRoundtripCheck: true,
    dateLinkFormat: '[{MM}/{DD}](./{YYYY}{MM}{DD})',
    templates: []
  }, (items) => {
    allowedUrlsEl.value = items.allowedUrls.join('\n');
    shortcutApplyEl.checked = items.shortcutApply;
    diffConfirmModeEl.value = items.diffConfirmMode;
    markdownRoundtripCheckEl.checked = items.markdownRoundtripCheck;
    dateLinkFormatEl.value = items.dateLinkFormat;
    
    // Load templates
    templates = items.templates || [];
    renderTemplates();
  });

  // Save rules function
  const saveOptions = () => {
    const lines = allowedUrlsEl.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Check for missing wildcards
    const missingUrls = lines.filter(line => !line.includes('*'));
    if (missingUrls.length > 0) {
      const exampleUrl = missingUrls[0];
      const proceed = confirm(`URLの中にワイルドカード（*）が含まれていないものがあります。\n\n例:\n修正前: ${exampleUrl}\n修正後: ${exampleUrl}*\n\n特定の1ページのみで動作させたい場合を除き、配下の全ページで動作させるために末尾に * を付けることを強く推奨します。\n\nこのまま保存しますか？`);
      if (!proceed) {
        return; // Cancel saving
      }
    }

    const shortcutApply = shortcutApplyEl.checked;
    const diffConfirmMode = diffConfirmModeEl.value;
    const markdownRoundtripCheck = markdownRoundtripCheckEl.checked;
    const dateLinkFormat = dateLinkFormatEl.value.trim() || '[{MM}/{DD}](./{YYYY}{MM}{DD})';
    
    chrome.storage.sync.set({ 
      allowedUrls: lines,
      shortcutApply: shortcutApply,
      diffConfirmMode: diffConfirmMode,
      markdownRoundtripCheck: markdownRoundtripCheck,
      dateLinkFormat: dateLinkFormat
    }, () => {
      statusEl.style.display = 'block';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 2000);
    });
  };

  // Save rules button click
  saveBtn.addEventListener('click', saveOptions);

  // Cmd+Enter or Ctrl+Enter to save
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.code === 'Enter') {
      e.preventDefault();
      saveOptions();
    }
  });

  // --- Template Functions ---

  const renderTemplates = () => {
    templateListEl.innerHTML = '';
    if (templates.length === 0) {
      templateListEl.innerHTML = '<span style="color: #999;">保存されているテンプレートはありません。</span>';
      return;
    }
    
    templates.forEach(t => {
      const itemDiv = document.createElement('div');
      itemDiv.style.display = 'flex';
      itemDiv.style.justifyContent = 'space-between';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.padding = '8px';
      itemDiv.style.borderBottom = '1px solid #eee';
      
      const titleSpan = document.createElement('span');
      titleSpan.textContent = t.title;
      titleSpan.style.fontWeight = 'bold';
      
      const actionsDiv = document.createElement('div');
      
      const editBtn = document.createElement('button');
      editBtn.textContent = '編集';
      editBtn.style.padding = '4px 8px';
      editBtn.style.fontSize = '12px';
      editBtn.style.marginRight = '8px';
      editBtn.style.backgroundColor = '#3498db';
      editBtn.addEventListener('click', () => {
        editTemplateIdEl.value = t.id;
        templateTitleEl.value = t.title;
        templateContentEl.value = t.content;
        templateFormTitleEl.textContent = 'テンプレートを編集';
        saveTemplateBtn.textContent = '更新';
        cancelTemplateBtn.style.display = 'inline-block';
      });
      
      const delBtn = document.createElement('button');
      delBtn.textContent = '削除';
      delBtn.style.padding = '4px 8px';
      delBtn.style.fontSize = '12px';
      delBtn.style.backgroundColor = '#e74c3c';
      delBtn.addEventListener('click', () => {
        if (confirm(`テンプレート「${t.title}」を削除しますか？`)) {
          templates = templates.filter(temp => temp.id !== t.id);
          saveTemplatesToStorage();
        }
      });
      
      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(delBtn);
      itemDiv.appendChild(titleSpan);
      itemDiv.appendChild(actionsDiv);
      templateListEl.appendChild(itemDiv);
    });
  };

  const saveTemplatesToStorage = () => {
    chrome.storage.sync.set({ templates }, () => {
      renderTemplates();
      resetTemplateForm();
    });
  };

  const resetTemplateForm = () => {
    editTemplateIdEl.value = '';
    templateTitleEl.value = '';
    templateContentEl.value = '';
    templateFormTitleEl.textContent = '新規テンプレート追加';
    saveTemplateBtn.textContent = '追加 / 更新';
    cancelTemplateBtn.style.display = 'none';
  };

  saveTemplateBtn.addEventListener('click', () => {
    const title = templateTitleEl.value.trim();
    const content = templateContentEl.value.trim();
    
    if (!title || !content) {
      alert('タイトルと本文を入力してください。');
      return;
    }
    
    const id = editTemplateIdEl.value;
    if (id) {
      // Update
      const index = templates.findIndex(t => t.id === id);
      if (index !== -1) {
        templates[index] = { id, title, content };
      }
    } else {
      // Create new
      const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      templates.push({ id: newId, title, content });
    }
    
    saveTemplatesToStorage();
  });

  cancelTemplateBtn.addEventListener('click', resetTemplateForm);

});
