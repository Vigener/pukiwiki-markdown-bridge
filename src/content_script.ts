chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // PukiWiki typically uses a textarea with name="msg"
  const textarea = document.querySelector('textarea[name="msg"]') as HTMLTextAreaElement;

  if (!textarea) {
    // We send empty or undefined if not found
    sendResponse({ error: 'Not found' });
    return false;
  }

  if (message.type === 'GET_TEXT') {
    sendResponse({ text: textarea.value });
  } else if (message.type === 'SET_TEXT') {
    textarea.value = message.text;
    // Dispatch input event so the page knows the text changed (some sites use JS to track changes)
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    sendResponse({ success: true });
  }

  return false;
});
