import { pukiwikiToMarkdown, markdownToPukiwiki } from './src/converter';

const pw = `
*** エッジケーステスト

// 1. 深いネストの箇条書き
- レベル1
-- レベル2
--- レベル3
---- レベル4
----- レベル5

// 2. 水平線 (箇条書きと混同しないか)
----
-----
------

// 3. WikiLink
[[リンク]]
[[エイリアス>リンク]]
[[エイリアス:リンク]]
`;

console.log('--- ORIGINAL PUKIWIKI ---');
console.log(pw);

const md = pukiwikiToMarkdown(pw);
console.log('\n--- CONVERTED MARKDOWN ---');
console.log(md);

const restoredPw = markdownToPukiwiki(md);
console.log('\n--- RESTORED PUKIWIKI ---');
console.log(restoredPw);

const expectedRestoredPw = `
*** エッジケーステスト

// 1. 深いネストの箇条書き
- レベル1
-- レベル2
--- レベル3
--- レベル4
--- レベル5

// 2. 水平線 (箇条書きと混同しないか)
----
-----
------

// 3. WikiLink
[[リンク]]
[[エイリアス>リンク]]
[[エイリアス:リンク]]
`;

const success = expectedRestoredPw.trim() === restoredPw.trim();
console.log('\n--- ROUNDTRIP MATCH ---');
console.log(success ? 'OK: 100% MATCH' : 'FAIL: MISMATCH');
if (!success) {
    import('fs').then(fs => {
        fs.writeFileSync('pw1.txt', pw.trim());
        fs.writeFileSync('pw2.txt', restoredPw.trim());
        console.log('Wrote to pw1.txt and pw2.txt. Check diff: diff -u pw1.txt pw2.txt');
    });
}
