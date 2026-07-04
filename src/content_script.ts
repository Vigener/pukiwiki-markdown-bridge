chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // PukiWiki typically uses a textarea with name="msg"
  let textarea = document.querySelector('textarea[name="msg"]') as HTMLTextAreaElement;
  
  if (!textarea) {
    // Fallback: just find any textarea if there's only one, or the largest one
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      textarea = textareas[0] as HTMLTextAreaElement;
    }
  }

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
