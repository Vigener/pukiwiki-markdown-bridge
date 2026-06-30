const DEFAULT_URLS = [
  'https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/*'
];

function matchPattern(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple wildcard to regex conversion
    // e.g. https://domain.com/* -> ^https:\/\/domain\.com\/.*$
    const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);
    if (regex.test(url)) {
      return true;
    }
  }
  return false;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) {
    chrome.storage.sync.get({ allowedUrls: DEFAULT_URLS }, (items) => {
      const allowed = matchPattern(tab.url as string, items.allowedUrls);
      if (allowed) {
        chrome.action.enable(tabId);
      } else {
        chrome.action.disable(tabId);
      }
    });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      chrome.storage.sync.get({ allowedUrls: DEFAULT_URLS }, (items) => {
        const allowed = matchPattern(tab.url as string, items.allowedUrls);
        if (allowed) {
          chrome.action.enable(activeInfo.tabId);
        } else {
          chrome.action.disable(activeInfo.tabId);
        }
      });
    }
  });
});
