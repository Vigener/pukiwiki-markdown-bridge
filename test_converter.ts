import { pukiwikiToMarkdown } from './src/converter';

const pwText = `
* 見出し1
** 見出し2
- リスト1
-- リスト2
| a | b |
| 1 | 2 |h
// コメント
`;

try {
  console.log("Start converting...");
  const result = pukiwikiToMarkdown(pwText);
  console.log("Result:", result);
  console.log("Result Length:", result.length);
} catch (e) {
  console.error("Error:", e);
}
