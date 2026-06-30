const DEFAULT_URLS = [
  'https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/*'
];

document.addEventListener('DOMContentLoaded', () => {
  const allowedUrlsEl = document.getElementById('allowedUrls') as HTMLTextAreaElement;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;

  // Load existing rules
  chrome.storage.sync.get({ allowedUrls: DEFAULT_URLS }, (items) => {
    allowedUrlsEl.value = items.allowedUrls.join('\n');
  });

  // Save rules
  saveBtn.addEventListener('click', () => {
    const lines = allowedUrlsEl.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    chrome.storage.sync.set({ allowedUrls: lines }, () => {
      statusEl.style.display = 'block';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 2000);
    });
  });
});
