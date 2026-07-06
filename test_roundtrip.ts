import { readFileSync, writeFileSync } from 'fs';
import { pukiwikiToMarkdown, markdownToPukiwiki } from './src/converter';

const original = readFileSync('convert_test/rules_page.txt', 'utf-8');
const md = pukiwikiToMarkdown(original);
writeFileSync('convert_test/rules_page_to_markdown.md', md);
const pw = markdownToPukiwiki(md);
writeFileSync('convert_test/rules_page_to_markdown_to_pukiwiki.txt', pw);
