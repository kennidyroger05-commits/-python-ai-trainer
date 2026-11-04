(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TrainerDownload=api;})(globalThis,function(){
  function create(environment=globalThis){
    return function save(filename,content,type='text/markdown'){
      let url,link;
      try{
        if(typeof filename!=='string'||!/[a-z0-9]/i.test(filename)||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(filename)||typeof content!=='string'||!['text/markdown','application/json','text/plain'].includes(type))return false;
        url=environment.URL.createObjectURL(new environment.Blob([content],{type:type+';charset=utf-8'}));
        link=environment.document.createElement('a');link.href=url;link.download=filename;environment.document.body.append(link);link.click();
        environment.setTimeout(()=>environment.URL.revokeObjectURL(url),1000);return true;
      }catch{if(url)try{environment.URL.revokeObjectURL(url);}catch{}return false;}
      finally{try{link?.remove();}catch{}}
    };
  }
  return {create,save:(...args)=>create()(...args)};
});
