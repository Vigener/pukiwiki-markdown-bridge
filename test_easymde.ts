import { JSDOM } from 'jsdom';
const dom = new JSDOM(`<!DOCTYPE html><textarea id="editor"></textarea>`);
global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

import EasyMDE from 'easymde';

try {
  const easyMDE = new EasyMDE({
    element: document.getElementById('editor') as any,
  });

  const existingKeys = easyMDE.codemirror.getOption("extraKeys") || {};
  console.log("existingKeys:", existingKeys);
  easyMDE.codemirror.setOption("extraKeys", { ...existingKeys, "Cmd-Enter": () => {} });
  console.log("Set option successful!");
} catch (e) {
  console.error("Error:", e);
}
