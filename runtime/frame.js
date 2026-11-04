// This script is embedded unchanged in a sandboxed srcdoc frame, never in the app origin.
(() => {
  const token = '__FRAME_TOKEN__'; let worker;
  window.addEventListener('pagehide',()=>worker?.terminate());
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.data?.token!==token)return;
    if(event.data.kind==='stop'){worker?.terminate();worker=null;parent.postMessage({token,kind:'stopped'},'*');return;}
    if(event.data.kind!=='start'||worker)return;
    const {source,assets,request,harness}=event.data;
    worker=new Worker(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));
    worker.onmessage=e=>{if(e.data?.token!==token)return;parent.postMessage(e.data,'*');if(['result','failure'].includes(e.data.kind)){worker?.terminate();worker=null;}};
    worker.onerror=e=>{parent.postMessage({token,kind:'failure',message:e.message||'Worker initialization failed'},'*');worker?.terminate();worker=null;};
    worker.postMessage({token,assets,request,harness},assets.map(a=>a.buffer));
  });
  parent.postMessage({token,kind:'ready'},'*');
})();
