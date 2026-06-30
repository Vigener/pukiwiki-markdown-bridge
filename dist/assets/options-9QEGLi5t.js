import"./modulepreload-polyfill-B5Qt9EMX.js";const o=["https://example.com/pukiwiki/?Your_Team/Your_Name*"];document.addEventListener("DOMContentLoaded",()=>{const l=document.getElementById("allowedUrls"),n=document.getElementById("saveBtn"),s=document.getElementById("status");chrome.storage.sync.get({allowedUrls:o},e=>{l.value=e.allowedUrls.join(`
`)}),n.addEventListener("click",()=>{const e=l.value.split(`
`).map(t=>t.trim()).filter(t=>t.length>0);chrome.storage.sync.set({allowedUrls:e},()=>{s.style.display="block",setTimeout(()=>{s.style.display="none"},2e3)})})});
