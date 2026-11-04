// Enforce the primary WASM memory maximum even when memory is defined inside the module.
// This supports the pinned Pyodide binary format, not arbitrary user modules.
(function(root){
 function cap(input,maximumBytes=64*1024*1024){
  if(!Number.isSafeInteger(maximumBytes)||maximumBytes<65536||maximumBytes%65536)throw Error('Invalid WASM memory budget');
  const bytes=input instanceof ArrayBuffer?new Uint8Array(input):new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
  if(bytes.length<8||[0,97,115,109,1,0,0,0].some((v,i)=>bytes[i]!==v))throw Error('Invalid WebAssembly header');
  let position=8;
  function uleb(end){let n=0n,shift=0n;for(let i=0;i<10;i++){if(position>=end)throw Error('Truncated WASM integer');const b=bytes[position++];n|=BigInt(b&127)<<shift;if(!(b&128)){if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Oversized WASM integer');return Number(n);}shift+=7n;}throw Error('Invalid WASM integer');}
  function encode(n){const result=[];do{let b=n%128;n=Math.floor(n/128);if(n)b|=128;result.push(b);}while(n);return result;}
  while(position<bytes.length){const start=position,id=bytes[position++],length=uleb(bytes.length),end=position+length;if(end>bytes.length)throw Error('Truncated WASM section');
   if(id!==5){position=end;continue;}
   const count=uleb(end),flags=uleb(end);if(count!==1||flags!==1)throw Error('Unsupported pinned WASM memory format');
   const initial=uleb(end),originalMaximum=uleb(end),maximum=Math.min(maximumBytes/65536,originalMaximum);
   if(position!==end||initial>maximum)throw Error('WASM initial memory exceeds budget');
   const body=[...encode(1),...encode(1),...encode(initial),...encode(maximum)],section=new Uint8Array([5,...encode(body.length),...body]);
   const limited=new Uint8Array(start+section.length+bytes.length-end);limited.set(bytes.subarray(0,start));limited.set(section,start);limited.set(bytes.subarray(end),start+section.length);
   return {buffer:limited.buffer,initialPages:initial,maximumPages:maximum};
  }
  throw Error('Pinned module must define one bounded memory');
 }
 const api={cap};if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.RuntimeMemory=api;
})(globalThis);
