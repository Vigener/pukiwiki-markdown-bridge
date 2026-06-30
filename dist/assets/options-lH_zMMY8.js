import"./modulepreload-polyfill-B5Qt9EMX.js";const o=["https://www.hpcs.cs.tsukuba.ac.jp/internal/pukiwiki/?Your_Team/Your_Name*"];document.addEventListener("DOMContentLoaded",()=>{const s=document.getElementById("allowedUrls"),n=document.getElementById("saveBtn"),l=document.getElementById("status");chrome.storage.sync.get({allowedUrls:o},e=>{s.value=e.allowedUrls.join(`
`)}),n.addEventListener("click",()=>{const e=s.value.split(`
`).map(t=>t.trim()).filter(t=>t.length>0);chrome.storage.sync.set({allowedUrls:e},()=>{l.style.display="block",setTimeout(()=>{l.style.display="none"},2e3)})})});
