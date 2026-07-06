import { pukiwikiToMarkdown, markdownToPukiwiki } from './src/converter';

const pw1 = '[[Architecture-team/ミーティング資料>Architecture-team/ミーティング資料]]';
const md1 = pukiwikiToMarkdown(pw1);
console.log('pw1 -> md1:', md1);
console.log('md1 -> pw1:', markdownToPukiwiki(md1));

const pw2 = '[[Architecture-team/ミーティング資料]]';
const md2 = pukiwikiToMarkdown(pw2);
console.log('pw2 -> md2:', md2);
console.log('md2 -> pw2:', markdownToPukiwiki(md2));

const md3 = '[[new_page]]';
console.log('md3 -> pw3:', markdownToPukiwiki(md3));
