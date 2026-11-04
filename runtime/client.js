(function(root){
  const BASE=new URL('runtime/',document.baseURI);
  const LIMITS={codeChars:24000,outputChars:32768,runMs:5000,initMs:90000,maxTests:8};
  const NAMES=['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
  function create(){
    let cached=null,active=null,serial=0,loading=null;
    async function resources(progress){
      if(cached)return cached;
      const controller=new AbortController();loading=controller;
      const load=async path=>{const r=await fetch(new URL(path,BASE),{signal:controller.signal});if(!r.ok)throw Error('Runtime resource unavailable: '+path);return r;};
      try{
        const manifest=await (await load('manifest.json')).json();
        if(manifest.version!=='0.29.3'||manifest.files.length!==NAMES.length||manifest.files.some((f,i)=>f.name!==NAMES[i]||!/^[a-f0-9]{64}$/.test(f.sha256)))throw Error('Unsupported runtime manifest');
        let loaded=0;const assets=[];
        for(const file of manifest.files){
          const buffer=await (await load('vendor/pyodide/'+file.name)).arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',buffer);const hex=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
          if(buffer.byteLength!==file.bytes||hex!==file.sha256)throw Error('Runtime integrity check failed: '+file.name);
          assets.push({name:file.name,buffer});loaded+=buffer.byteLength;progress?.({phase:'downloading',loaded,total:manifest.totalBytes});
        }
        const [source,frame,harness]=await Promise.all(['worker.js','frame.js','runner.py'].map(async f=>(await load(f)).text()));
        cached={assets,source,frame,harness,version:manifest.version};return cached;
      }finally{if(loading===controller)loading=null;}
    }
    function stop(reason='cancelled'){
      serial++;loading?.abort();if(!active)return;const current=active;active=null;clearTimeout(current.timer);window.removeEventListener('message',current.listener);current.frame.contentWindow?.postMessage({token:current.token,kind:'stop'},'*');setTimeout(()=>current.frame.remove(),100);
      current.resolve({status:reason,stdout:'',stderr:reason==='initialization_error'?'Interpreter initialization timed out.':'',cases:[],durationMs:current.runStarted?Math.round(performance.now()-current.runStarted):0});
    }
    function execute(request,bundle,id,onProgress,timeoutMs){
      if(id!==serial)return Promise.resolve({status:'cancelled',stdout:'',stderr:'',cases:[]});
      const token=[...crypto.getRandomValues(new Uint8Array(24))].map(x=>x.toString(16).padStart(2,'0')).join('');
      const frame=document.createElement('iframe');frame.hidden=true;frame.sandbox='allow-scripts';frame.referrerPolicy='no-referrer';frame.setAttribute('aria-hidden','true');
      const csp="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'";
      frame.srcdoc=`<meta http-equiv="Content-Security-Policy" content="${csp}"><script>${bundle.frame.replace('__FRAME_TOKEN__',token).replaceAll('</script','<\\/script')}<\/script>`;
      return new Promise(resolve=>{
        const finish=result=>{if(active?.token!==token)return;clearTimeout(active.timer);window.removeEventListener('message',listener);active=null;frame.remove();resolve(result);};
        const listener=event=>{
          if(event.source!==frame.contentWindow||event.origin!=='null'||event.data?.token!==token)return;const msg=event.data;
          if(msg.kind==='ready'){
            const assets=bundle.assets.map(a=>({name:a.name,buffer:a.buffer.slice(0)}));frame.contentWindow.postMessage({kind:'start',token,assets,source:bundle.source,request,harness:bundle.harness},'*',assets.map(a=>a.buffer));
          }else if(msg.kind==='phase'){
            onProgress?.({phase:msg.phase});if(msg.phase==='running'){clearTimeout(active.timer);active.runStarted=performance.now();active.timer=setTimeout(()=>stop('timeout'),Math.max(100,Math.min(timeoutMs,15000)));}
          }else if(msg.kind==='result')finish(msg.result);
          else if(msg.kind==='failure')finish({status:'initialization_error',stdout:'',stderr:String(msg.message).slice(0,4000),cases:[]});
        };
        active={frame,token,resolve,listener,runStarted:null,timer:setTimeout(()=>stop('initialization_error'),LIMITS.initMs)};
        window.addEventListener('message',listener);document.body.append(frame);
      });
    }
    async function run(request,{onProgress,timeoutMs=LIMITS.runMs}={}){
      stop();const id=serial;
      if(typeof request.code!=='string'||request.code.length>LIMITS.codeChars)throw Error('Code exceeds the local learning runtime limit');
      const tests=request.mode==='validate'?request.tests:[];
      if(request.mode==='validate'&&(!Array.isArray(tests)||!tests.length||tests.length>LIMITS.maxTests))throw Error('Invalid registered test count');
      let bundle;try{onProgress?.({phase:'loading'});bundle=await resources(onProgress);}catch(e){return {status:id!==serial?'cancelled':'initialization_error',stdout:'',stderr:id!==serial?'':String(e.message),cases:[]};}
      if(id!==serial)return {status:'cancelled',stdout:'',stderr:'',cases:[]};
      if(!tests.length)return execute({...request,tests:[]},bundle,id,onProgress,timeoutMs);
      const combined={status:'success',stdout:'',stderr:'',cases:[],durationMs:0,pythonVersion:null};
      // Every validation case has its own worker/VM, including module state and builtins.
      for(let i=0;i<tests.length;i++){
        onProgress?.({phase:'testing',completed:i,total:tests.length});
        const result=await execute({...request,tests:[tests[i]]},bundle,id,onProgress,timeoutMs);
        if(!['success','tests_failed'].includes(result.status))return {...result,cases:[...combined.cases,...(result.cases||[])]};
        combined.stdout=(combined.stdout+result.stdout).slice(0,LIMITS.outputChars);combined.stderr=(combined.stderr+result.stderr).slice(0,LIMITS.outputChars);combined.cases.push(...result.cases);combined.durationMs+=result.durationMs||0;combined.pythonVersion=result.pythonVersion;
        onProgress?.({phase:'case_completed',completed:i+1,total:tests.length});
      }
      combined.status=combined.cases.every(c=>c.passed)?'success':'tests_failed';return combined;
    }
    return {run,stop,release(){stop();cached=null;},limits:LIMITS};
  }
  root.PythonExecutor={create,LIMITS};
})(globalThis);
