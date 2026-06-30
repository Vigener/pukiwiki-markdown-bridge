const DEFAULT_URLS = [
  'https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/?Your_Team/Your_Name*'
];

function matchPattern(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern === 'https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/?Your_Team/Your_Name*') {
      if (url.startsWith('https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/')) return true;
    }

    // 1. Exact or wildcard match
    const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);
    if (regex.test(url)) return true;
    
    // 2. Smarter Pukiwiki match
    const pwMatch = pattern.match(/^(https?:\/\/[^?]+\/\?)(?!cmd=)(.*)$/);
    if (pwMatch) {
      const baseUrl = pwMatch[1].replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const pagePattern = pwMatch[2].replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const smartRegexStr = '^' + baseUrl + '(?:cmd=[^&]+&page=)?' + pagePattern + '$';
      const smartRegex = new RegExp(smartRegexStr);
      if (smartRegex.test(url)) return true;
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
