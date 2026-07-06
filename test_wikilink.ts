import { markdownToPukiwiki } from './src/converter';

const md = '[[new_page]]';
console.log('md:', md);
console.log('pw:', markdownToPukiwiki(md));
