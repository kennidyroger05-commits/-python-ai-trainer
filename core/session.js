(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports&&typeof require==='function')module.exports=api;root.TrainerSession=api;})(globalThis,function(){
  const blank=()=>({answer:'',attempts:0,hintLevel:0,simStep:-1,feedback:null,solved:false,investigation:null,simOpen:false});
  function create(){const sessions=new Map();return {get(id){if(!sessions.has(id))sessions.set(id,blank());return sessions.get(id);},save(id,value){sessions.set(id,structuredClone(value));},clear(){sessions.clear();}};}
  return {create};
});
