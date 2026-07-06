import { markdownToPukiwiki, pukiwikiToMarkdown } from './src/converter';

// Test 1: PukiWiki [[old_page]] roundtrips perfectly
const pw1 = '[[old_page]]';
const md1 = pukiwikiToMarkdown(pw1);
const pw1_restored = markdownToPukiwiki(md1);
console.log('Test 1 (Roundtrip):', pw1 === pw1_restored ? 'OK' : `FAIL: ${pw1} -> ${md1} -> ${pw1_restored}`);

// Test 2: Markdown [[new_page]] goes to [[new_page>./new_page]]?
// I haven't implemented it yet. Let's see what happens now.
const md2 = '[[new_page]]';
const pw2 = markdownToPukiwiki(md2);
console.log('Test 2 (Markdown WikiLink):', md2, '->', pw2);
