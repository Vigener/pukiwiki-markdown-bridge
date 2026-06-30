(function(){chrome.runtime.onMessage.addListener((t,u,r)=>{const e=document.querySelector('textarea[name="msg"]');return e?(t.type==="GET_TEXT"?r({text:e.value}):t.type==="SET_TEXT"&&(e.value=t.text,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),r({success:!0})),!1):(r({error:"Not found"}),!1)});
})()
