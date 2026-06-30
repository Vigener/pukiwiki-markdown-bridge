import EasyMDE from 'easymde';
import { pukiwikiToMarkdown, markdownToPukiwiki } from '../converter';

document.addEventListener('DOMContentLoaded', async () => {
  const applyBtn = document.getElementById('apply-btn') as HTMLButtonElement;
  const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement;

  if (!applyBtn || !textarea) return;

  const DEFAULT_URLS = ['https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/?Your_Team/Your_Name*'];
  const items = await chrome.storage.sync.get({ allowedUrls: DEFAULT_URLS });
  if (items.allowedUrls.length === 1 && items.allowedUrls[0] === DEFAULT_URLS[0]) {
    chrome.runtime.openOptionsPage();
    window.close();
    return;
  }

  // Initialize EasyMDE
  const easyMDE = new EasyMDE({
    element: textarea,
    spellChecker: false,
    autofocus: true,
    status: false,
    toolbar: ['bold', 'italic', 'strikethrough', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', 'table', 'horizontal-rule', '|', 'preview', 'side-by-side', 'fullscreen', '|', 'guide']
  });

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    try {
      // Get PukiWiki text from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_TEXT' });
      if (response && response.text !== undefined) {
        // Convert to Markdown and set it to editor
        const mdText = pukiwikiToMarkdown(response.text);
        easyMDE.value(mdText);
      } else {
        easyMDE.value('テキストエリアが見つかりませんでした。');
      }
    } catch (e) {
      console.error('Error communicating with content script:', e);
      easyMDE.value('通信エラー。ページをリロードして再試行してください。');
    }
  }

  // Handle apply button
  applyBtn.addEventListener('click', async () => {
    if (tab && tab.id) {
      const mdText = easyMDE.value();
      const pwText = markdownToPukiwiki(mdText);
      
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'SET_TEXT', text: pwText });
        window.close(); // Close popup after applying
      } catch (e) {
        console.error('Error applying text:', e);
        alert('適用に失敗しました。');
      }
    }
  });
});
