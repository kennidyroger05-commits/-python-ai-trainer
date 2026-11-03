"""Use CPython only in development to cross-check trusted static lesson fixtures."""
import contextlib, io, json
from pathlib import Path
lessons=json.loads(Path('exercises.json').read_text())
expected=['','0.82\n','','gemini\n',None,'True\n','ready\n','backup\n','','0.91\n','local\n','','0.84\n','backup\n','backup\n']
for i,e in enumerate(lessons):
    code='\n'.join(filter(None,[e.get('context','') if i!=0 else '', e.get('code',''),e.get('answers',[''])[0]]))
    output=io.StringIO();scope={}
    try:
        with contextlib.redirect_stdout(output):exec(compile(code,e['id'],'exec'),scope)
    except IndexError:
        assert i==4
    else:
        assert output.getvalue()==expected[i],(e['id'],output.getvalue())
        if i==0:assert scope['score']==.82
        if i==2:assert scope['melhor']==.91
    if 'simulation'in e:
        sim=e['simulation'];out=io.StringIO();env={}
        with contextlib.redirect_stdout(out):exec(sim['code'],env)
        assert out.getvalue().splitlines()==sim['steps'][-1]['output']
        for k,v in sim['steps'][-1]['variables'].items():assert env[k]==v
        # Check all intermediate states by tracing completed executable lines.
        import sys
        captured=[];previous=[None]
        def tracer(frame,event,arg):
            if frame.f_code.co_filename!='lesson':return tracer
            if event in ('line','return'):
                if previous[0] is not None:captured.append((previous[0],{k:v for k,v in frame.f_locals.items() if not k.startswith('__')},out.getvalue().splitlines()))
                previous[0]=frame.f_lineno-1 if event=='line' else None
            return tracer
        out=io.StringIO();sys.settrace(tracer)
        try:
            with contextlib.redirect_stdout(out):exec(compile(sim['code'],'lesson','exec'),{})
        finally:sys.settrace(None)
        for step in sim['steps']:
            candidates=[c for c in captured if c[0]==step['line']]
            if sim['code'].splitlines()[step['line']].strip()=='else:':continue
            assert any(v==step['variables'] and o==step['output'] for _,v,o in candidates),(e['id'],step,captured)
print('PASS CPython: all 15 lesson results, intentional IndexError, and intermediate/final states for all 3 simulations')
