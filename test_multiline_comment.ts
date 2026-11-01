import { pukiwikiToMarkdown, markdownToPukiwiki } from './src/converter';

// Test 1: User snippet
const userSnippet = `[Architecture-team/igarashi](./Architecture-team/igarashi)<!--PW_LINK-->

<!--
スライド: なし（今週は PukiWiki のみ）
前回: [[team-mtg-pukiwiki-2026-10-27]]
「MTGメモ」は MTG 後に summarize-mtg で埋める。
-->

# やったこと

- 先週からの体調不良の長引きに加え、雙峰祭の手伝い等で時間が取れず、今週の実験・進捗は特になし。

# やること

- 回路を固定してカット数 $K$ だけを変化させる実験（chain・star 回路、第1段階）の測定・評価
- （状況に応じて）QAOA等の実回路における切断・シミュレーション挙動の確認`;

const pw1 = markdownToPukiwiki(userSnippet);
const md1 = pukiwikiToMarkdown(pw1);
if (userSnippet !== md1) {
  console.error("FAIL: userSnippet roundtrip mismatch!");
  console.error("Expected:\n", userSnippet);
  console.error("Got:\n", md1);
  process.exit(1);
}

// Test 2: Single line comment
const singleMd = `<!-- single line comment -->`;
const singlePw = markdownToPukiwiki(singleMd);
const singleBack = pukiwikiToMarkdown(singlePw);
if (singleMd !== singleBack) {
  console.error("FAIL: singleMd roundtrip mismatch!");
  process.exit(1);
}

// Test 3: Multiline with empty lines
const multiEmptyMd = `<!--
line 1

line 2
-->`;
const multiEmptyPw = markdownToPukiwiki(multiEmptyMd);
const multiEmptyBack = pukiwikiToMarkdown(multiEmptyPw);
if (multiEmptyMd !== multiEmptyBack) {
  console.error("FAIL: multiEmptyMd roundtrip mismatch!");
  process.exit(1);
}

// Test 4: Adjacent multiline comments
const adjacentMd = `<!--
first block
-->
<!--
second block
-->`;
const adjacentPw = markdownToPukiwiki(adjacentMd);
const adjacentBack = pukiwikiToMarkdown(adjacentPw);
if (adjacentMd !== adjacentBack) {
  console.error("FAIL: adjacentMd roundtrip mismatch!");
  process.exit(1);
}

// Test 5: Special characters inside comment
const specialMd = `<!--
# Not a heading
- Not a list
1. Not a number list
| Not | a | table |
-->`;
const specialPw = markdownToPukiwiki(specialMd);
const specialBack = pukiwikiToMarkdown(specialPw);
if (specialMd !== specialBack) {
  console.error("FAIL: specialMd roundtrip mismatch!");
  process.exit(1);
}

console.log("All multiline comment tests passed!");
