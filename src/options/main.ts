const DEFAULT_URLS = [
  'https://example.com/pukiwiki/?Your_Team/Your_Name*'
];

document.addEventListener('DOMContentLoaded', () => {
  const allowedUrlsEl = document.getElementById('allowedUrls') as HTMLTextAreaElement;
  const shortcutApplyEl = document.getElementById('shortcutApply') as HTMLInputElement;
  const diffConfirmModeEl = document.getElementById('diffConfirmMode') as HTMLSelectElement;
  const markdownRoundtripCheckEl = document.getElementById('markdownRoundtripCheck') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;

  // Load existing rules
  chrome.storage.sync.get({ 
    allowedUrls: DEFAULT_URLS,
    shortcutApply: true,
    diffConfirmMode: 'deletions_only',
    markdownRoundtripCheck: true
  }, (items) => {
    allowedUrlsEl.value = items.allowedUrls.join('\n');
    shortcutApplyEl.checked = items.shortcutApply;
    diffConfirmModeEl.value = items.diffConfirmMode;
    markdownRoundtripCheckEl.checked = items.markdownRoundtripCheck;
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
    
    chrome.storage.sync.set({ 
      allowedUrls: lines,
      shortcutApply: shortcutApply,
      diffConfirmMode: diffConfirmMode,
      markdownRoundtripCheck: markdownRoundtripCheck
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
});
