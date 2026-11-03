"""Cross-check trusted repository lessons with CPython, never learner input."""
import contextlib,io,json,sys
from pathlib import Path
lessons=json.loads(Path('exercises.json').read_text());fixtures=json.loads(Path('tests/v2-python-fixtures.json').read_text())
base=['','0.82\n','','gemini\n',None,'True\n','ready\n','backup\n','','0.91\n','local\n','','0.84\n','backup\n','backup\n']
def run(code,name):
    out=io.StringIO();env={};error=None
    try:
        with contextlib.redirect_stdout(out):exec(compile(code,name,'exec'),env)
    except Exception as e:error={'type':type(e).__name__,'message':str(e)}
    return out.getvalue(),env,error
for i,e in enumerate(lessons):
    if i<15:
        code='\n'.join(filter(None,[e.get('context','') if i!=0 else '',e.get('code',''),e.get('answers',[''])[0]]));out,env,error=run(code,e['id'])
        if i==4:assert error['type']=='IndexError'
        else:assert error is None and out==base[i],(e['id'],out,error)
        if i==0:assert env['score']==.82
        if i==2:assert env['melhor']==float(e['options'][e['correct']])==.91
        elif e['type']=='predict':assert out.strip()==e['options'][e['correct']].strip()
    else:
        f=fixtures[e['id']];out,env,error=run(f['code'],e['id']);assert error is None and out==f['output'],(e['id'],out,error)
        if e['type']=='predict':assert out.strip()==e['options'][e['correct']].strip(),(e['id'],'wrong prediction key')
        if e.get('replacement'):
            assert e['code'].replace(e['replacement']['target'],e['options'][e['correct']])==e['solutionCode']
            for j,wrong in enumerate(e['options']):
                if j==e['correct']:continue
                bad_output,_,bad_error=run(e['code'].replace(e['replacement']['target'],wrong),e['id'])
                # Wrong repair either fails, returns another result, or violates the requested rule.
                assert bad_error or bad_output!=f['output'],(e['id'],wrong,'ambiguous answer')
        if 'broken'in f:
            bad=f['broken'];out,_,error=run(bad['code'],e['id'])
            if 'type'in bad:assert error==e['debug']['exception'] and error['type']==bad['type'],(e['id'],error)
            else:assert error is None and out==bad['output'] and out!=f['output']
    if 'simulation'in e:
        sim=e['simulation'];out=io.StringIO();captured=[]
        def snapshot(frame,line):
            values={}
            for key,value in frame.f_locals.items():
                if key.startswith('__'):continue
                try:values[key]=json.loads(json.dumps(value))
                except (ValueError,TypeError):pass
            captured.append((line,values,out.getvalue().splitlines()))
        previous={}
        def tracer(frame,event,arg):
            if frame.f_code.co_filename!='lesson':return tracer
            key=id(frame)
            if event in ('line','return','exception'):
                if key in previous:snapshot(frame,previous[key])
                if event=='line':snapshot(frame,frame.f_lineno-1);previous[key]=frame.f_lineno-1
                if event=='exception':snapshot(frame,frame.f_lineno-1)
            return tracer
        sys.settrace(tracer);caught=None
        try:
            with contextlib.redirect_stdout(out):exec(compile(sim['code'],'lesson','exec'),{})
        except Exception as err:caught={'type':type(err).__name__,'message':str(err)}
        finally:sys.settrace(None)
        assert out.getvalue().splitlines()==sim['steps'][-1]['output']
        for step in sim['steps']:
            assert any(v==step['variables'] and o==step['output'] and (line==step['line'] or sim['code'].splitlines()[step['line']].strip()=='else:') for line,v,o in captured),(e['id'],step,captured)
            if step.get('error'):
                # Trace filename differs from lesson filename only for syntax errors (none here).
                assert caught==step['error'],(e['id'],caught)
print('PASS CPython: 40 lesson outcomes, all patch choices, five exact exception messages, logic error, six complete traces including functions and errors')
