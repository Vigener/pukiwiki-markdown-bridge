let line1 = '[old_page](./old_page)<!--PW_LINK-->'; // generated from Pukiwiki [[old_page]]
let line2 = '[[new_page]]'; // manually typed in Markdown

// 1. Convert Obsidian-style Markdown WikiLinks FIRST
line1 = line1.replace(/\[\[(.*?)\]\]/g, (match, text) => {
  if (text.includes('>') || text.includes(':')) return match;
  return `[[${text}>./${text}]]`;
});
line2 = line2.replace(/\[\[(.*?)\]\]/g, (match, text) => {
  if (text.includes('>') || text.includes(':')) return match;
  return `[[${text}>./${text}]]`;
});

// 2. Convert standard Markdown links
line1 = line1.replace(/\[(.*?)\]\((.*?)\)(<!--:-->)?(<!--PW_LINK-->)?/g, (match, text, url, colon, pwLink) => {
  if (pwLink) return `[[${text}]]`;
  if (colon) return `[[${text}:${url}]]`;
  return `[[${text}>${url}]]`;
});
line2 = line2.replace(/\[(.*?)\]\((.*?)\)(<!--:-->)?(<!--PW_LINK-->)?/g, (match, text, url, colon, pwLink) => {
  if (pwLink) return `[[${text}]]`;
  if (colon) return `[[${text}:${url}]]`;
  return `[[${text}>${url}]]`;
});

console.log('line1:', line1); // Expect: [[old_page]]
console.log('line2:', line2); // Expect: [[new_page>./new_page]]
