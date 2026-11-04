// One request, one interpreter. Runs only inside an opaque-origin sandboxed frame.
const nativePost = globalThis.postMessage.bind(globalThis);
let received = false;
globalThis.onmessage = async event => {
  if (received) return; received = true;
  const { token, assets, request, harness } = event.data;
  const emit = (kind, data = {}) => nativePost({ token, kind, ...data });
  const resources = new Map(assets.map(a => [a.name, a.buffer]));
  const blobModule = name => URL.createObjectURL(new Blob([resources.get(name)], { type: 'text/javascript' }));
  try {
    emit('phase', { phase: 'initializing' });
    // All resources have already been fetched and verified by the trusted parent.
    // The frame/worker CSP forbids real network requests, even if a program bypasses Python policy.
    Object.defineProperty(globalThis, 'fetch', { configurable:false, writable:false, value: async input => {
      const name = new URL(typeof input === 'string' ? input : input.url || String(input),'https://offline.invalid/').pathname.split('/').pop();
      if (!['pyodide.asm.wasm','python_stdlib.zip'].includes(name) || !resources.has(name)) throw Error('Network access is disabled');
      return new Response(resources.get(name), { headers:{'Content-Type': name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'} });
    }});
    for (const name of ['Worker','SharedWorker','WebSocket','XMLHttpRequest','EventSource','BroadcastChannel','indexedDB','caches']) {
      try { Object.defineProperty(globalThis,name,{value:undefined,writable:false,configurable:false}); } catch {}
    }
    // Enforce the actual WebAssembly linear-memory maximum before bootstrap.
    // This does not cap the JS heap or all browser overhead.
    const memoryLimitBytes=64*1024*1024,NativeMemory=WebAssembly.Memory;
    const limited=RuntimeMemory.cap(resources.get('pyodide.asm.wasm'),memoryLimitBytes);
    resources.set('pyodide.asm.wasm',limited.buffer);
    const BoundedMemory=new Proxy(NativeMemory,{construct(Target,args){
      const descriptor={...args[0],maximum:Math.min(args[0].maximum??1024,1024)};
      if(descriptor.initial>descriptor.maximum)throw Error('Runtime exceeds the 64 MiB WASM memory budget');
      return Reflect.construct(Target,[descriptor]);
    }});
    Object.defineProperty(WebAssembly,'Memory',{value:BoundedMemory,writable:false,configurable:false});
    importScripts(blobModule('pyodide.js'));
    const {default:createPyodideModule}=await import(blobModule('pyodide.asm.mjs'));
    // Published experimental injection point, pinned and tested; no module worker or same-origin frame.
    const py = await loadPyodide({ indexURL:'https://offline.invalid/',
      createPyodideModule,lockFileContents:JSON.parse(new TextDecoder().decode(resources.get('pyodide-lock.json'))),
      jsglobals:Object.freeze({}), stdout:()=>{}, stderr:()=>{}, packages:[] });
    py.runPython(harness);
    py.globals.set('_lab_payload', JSON.stringify(request));
    emit('phase',{phase:'running'});
    const started=performance.now();
    const result=JSON.parse(py.runPython('_lab_execute_json(_lab_payload)'));
    emit('result',{result:{...result,memoryLimitBytes,durationMs:Math.round(performance.now()-started)}});
  } catch(error) {emit('failure',{message:String(error?.message||error).slice(0,4000)});}
};
