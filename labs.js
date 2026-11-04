(function(root){
  function validate(data){
    const ids=new Set();
    if(!Array.isArray(data)||!data.length)throw Error('Missing simulated labs');
    for(const c of data){
      if(!c?.id||ids.has(c.id)||['pt','mixed','en'].some(l=>typeof c.title?.[l]!=='string'||!c.title[l].trim())||!Array.isArray(c.stages)||c.stages.length!==8||c.stages.some(s=>!s||typeof s.pt!=='string'||typeof s.en!=='string'||!s.pt.trim()||!s.en.trim()||!Object.hasOwn(s,'data')||!Object.hasOwn(s,'dataEn'))||!Array.isArray(c.choices)||c.choices.length!==3||new Set(c.choices).size!==3||!Number.isInteger(c.correct)||c.correct<0||c.correct>2)throw Error('Invalid simulated lab');
      ids.add(c.id);
    }return data;
  }
  function create(data,language,onHome){
    validate(data);
    const $=id=>document.getElementById(id);let selected=null,index=0,answer=null;
    const names={pt:['Entrada','Prompt','API simulada','Resposta','Validação Python simulada','Decisão','Ferramenta simulada','Resultado'],en:['Input','Prompt','Simulated API','Response','Simulated Python validation','Decision','Simulated tool','Result']};
    function render(){
      const lang=language(),en=lang==='en';$('labTitle').textContent=en?'Simulated AI lab':'Laboratório de IA simulada';$('labNotice').textContent=en?'Fictional data; no network calls or real tool execution.':'Dados fictícios; sem chamadas de rede ou execução real de ferramentas.';
      $('labHome').textContent=en?'← Home':'← Início';$('labChoices').replaceChildren();
      data.forEach(c=>{const b=document.createElement('button');b.textContent=c.title[lang];b.onclick=()=>{selected=c;index=0;answer=null;render();};$('labChoices').append(b);});
      $('labFlow').hidden=!selected;if(!selected)return;
      const stage=selected.stages[index];$('labStage').textContent=`${index+1}/8 · ${names[en?'en':'pt'][index]}`;
      $('labData').textContent=JSON.stringify(en?stage.dataEn:stage.data,null,2);$('labExplanation').textContent=stage[en?'en':'pt'];$('labActions').replaceChildren();
      if(index===5){selected.choices.forEach((choice,i)=>{const b=document.createElement('button');b.textContent=choice;b.setAttribute('aria-pressed',String(answer===i));b.onclick=()=>{answer=i;render();};$('labActions').append(b);});$('labFeedback').textContent=answer===null?'':answer===selected.correct?(en?'Validated choice.':'Escolha validada.'):(en?'This action violates the validation.':'Essa ação viola a validação.');}else $('labFeedback').textContent='';
      $('labNext').textContent=en?'Next stage':'Próxima etapa';$('labPrev').textContent=en?'Previous stage':'Etapa anterior';$('labRestart').textContent=en?'Restart flow':'Reiniciar fluxo';
      $('labPrev').disabled=index===0;$('labNext').disabled=index===7||(index===5&&answer!==selected.correct);
    }
    $('labNext').onclick=()=>{if(index<7&&!(index===5&&answer!==selected.correct)){index++;render();}};
    $('labPrev').onclick=()=>{index=Math.max(0,index-1);render();};$('labRestart').onclick=()=>{index=0;answer=null;render();};$('labHome').onclick=onHome;
    return {render};
  }
  root.TrainerLabs={create,validate};if(typeof module==='object'&&module.exports)module.exports=root.TrainerLabs;
})(globalThis);
