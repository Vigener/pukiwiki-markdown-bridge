import { markdownToPukiwiki } from './src/converter';
const md = '    - インライン要素';
console.log('OUTPUT:', markdownToPukiwiki(md));
