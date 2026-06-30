const DEFAULT_URLS = [
  'https://example.com/pukiwiki/?Your_Team/Your_Name*'
];

document.addEventListener('DOMContentLoaded', () => {
  const allowedUrlsEl = document.getElementById('allowedUrls') as HTMLTextAreaElement;
  const shortcutApplyEl = document.getElementById('shortcutApply') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;

  // Load existing rules
  chrome.storage.sync.get({ 
    allowedUrls: DEFAULT_URLS,
    shortcutApply: true
  }, (items) => {
    allowedUrlsEl.value = items.allowedUrls.join('\n');
    shortcutApplyEl.checked = items.shortcutApply;
  });

  // Save rules
  saveBtn.addEventListener('click', () => {
    const lines = allowedUrlsEl.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const shortcutApply = shortcutApplyEl.checked;
    
    chrome.storage.sync.set({ 
      allowedUrls: lines,
      shortcutApply: shortcutApply
    }, () => {
      statusEl.style.display = 'block';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 2000);
    });
  });
});
