"""Trusted static solutions only. Not a runtime for learner-provided code."""
import json,contextlib,io,subprocess
from pathlib import Path
BASE=Path('projects');projects=json.loads((BASE/'catalog.json').read_text());debug=json.loads((BASE/'debugging.json').read_text());tutorial=json.loads((BASE/'testing.json').read_text());datasets=json.loads((BASE/'datasets.json').read_text())
def env(code,id):
    namespace={}
    with contextlib.redirect_stdout(io.StringIO()):exec(compile(code,id,'exec'),namespace)
    return namespace
outputs={}
for a in projects:
    n=env(a['solutionCode'],a['id'])
    if a['id']=='model-router':
        for c in a['cases']:
            observed=n['route'](c['input']['request'],c['input']['available']);assert observed==c['expected'];outputs[a['id']+'/'+c['id']]=observed
    elif a['id']=='api-client':
        for c in a['cases']:
            observed=n['client'](c['input']);assert observed==c['expected'];outputs[a['id']+'/'+c['id']]=observed
        request=datasets['api']['request'];assert json.loads(json.dumps(request))==request
    elif a['id']=='model-evaluation':
        result=n['evaluate'](datasets['evaluation']);assert result['model_a']['accuracy']==.75 and result['model_b']['accuracy']==.5
        assert result['model_a']['failed_ids']==['task-4'] and result['model_b']['failed_ids']==['task-2','task-4']
        assert n['accuracy']([],[]) is None
        assert n['accuracy'](['a'],['a','b'])==.5
        outputs[a['id']]=result
    else:
        data=datasets['training'];selected=n['select_checkpoint'](data['logs']);assert selected['epoch']==2 and selected['validation_loss']==.6
        assert n['select_checkpoint']([]) is None
        assert set(data['train_ids']).isdisjoint(data['validation_ids'])
        assert len(data['train_ids'])/2==2
        assert data['logs'][-1]['training_loss']<data['logs'][-2]['training_loss'] and data['logs'][-1]['validation_loss']>data['logs'][-2]['validation_loss']
        outputs[a['id']]=selected
    for tr in a['traces']:
        nodes=tr['nodes'];assert len({node['id'] for node in nodes})==len(nodes)
        if a['id']=='model-router':assert nodes[-1]['output']==outputs[a['id']+'/'+tr['id']]
        if a['id']=='api-client':assert nodes[-1]['output']==outputs[a['id']+'/'+tr['id']]
        if a['id']=='model-evaluation':
            model=tr['id'];result=outputs[a['id']][model];assert nodes[2]['output']=={'correct':result['correct'],'total':result['total']};assert nodes[3]['output']['accuracy']==result['accuracy'];assert nodes[-1]['output']['latency_ms']==result['latency_ms'];assert nodes[-1]['output']['cost_usd']==result['cost_usd']
        if a['id']=='training-pipeline':assert nodes[-1]['output']['selected_epoch']==2
for a in debug:
    namespace=env(a['sourceCode'],a['id'])
    try:
        observed=eval(compile(a['trigger'],a['id'],'eval'),namespace)
    except Exception as err:assert a['sourceEvidence']=={'type':type(err).__name__,'message':str(err)},(a['id'],err)
    else:assert a['sourceEvidence']=={'observed':observed,'exception':None}
    def actual(namespace,test):
        try:return eval(compile(test['call'],a['id'],'eval'),namespace)
        except Exception as err:return {'error':type(err).__name__}
    solution=env(a['solutionCode'],a['id'])
    for test in a['tests']:
        observed=actual(solution,test);assert observed==test['expected'],(a['id'],test,observed);outputs[a['id']+'/'+test['id']]=observed
    for incorrect in a['incorrectSolutions']:
        broken=env(incorrect,a['id']);assert any(actual(broken,t)!=t['expected'] for t in a['tests']),a['id']+' ambiguous repair'
    # The correct assertion selection, where it is Python, must pass on the repaired implementation.
    last=a['steps'][-1];choice=next(c for c in last['choices'] if c['id']==last['correctId'])['label']['en']
    if choice.startswith('assert '):exec(compile(choice,a['id'],'exec'),solution)
    assert a['traces'][0]['nodes'][0]['output']==a['sourceEvidence']
n=env(tutorial[0]['solutionCode'],'testing-basics');assert n['dobro'](3)==6 and n['dobro'](0)==0
# Explicit counterexample: passing one edge test does not prove the function is correct.
broken=env('def dobro(valor):\n    return 0\n','counterexample');assert broken['dobro'](0)==0;assert broken['dobro'](3)!=6
# Cross-check every small JS simulation against the trusted Python solution on the same cases.
js='''const M=require('./projects/models'),data=require('./projects/datasets.json'),out={};for(const a of require('./projects/catalog.json')){if(a.id==='model-router')for(const c of a.cases)out[a.id+'/'+c.id]=M.route(c.input.request,c.input.available);if(a.id==='api-client')for(const c of a.cases)out[a.id+'/'+c.id]=M.client(c.input);if(a.id==='model-evaluation')out[a.id]=M.evaluate(data.evaluation);if(a.id==='training-pipeline')out[a.id]=M.checkpoint(data.training.logs);}for(const a of require('./projects/debugging.json'))for(const c of a.tests)out[a.id+'/'+c.id]=M.debugResult(a.id,c.input);console.log(JSON.stringify(out));'''
js_output=json.loads(subprocess.check_output(['node','-e',js],text=True));assert js_output==outputs,(js_output,outputs)
print('PASS CPython V3: four full project solutions, 8 broken/repair cases, 16 rejected repairs, 24 debug cases, JSON roundtrip, evaluation/training traces and JS/Python parity')
