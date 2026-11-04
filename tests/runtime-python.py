"""CPython oracle for trusted repository fixtures only; no learner code is received."""
import json, runpy, sys
from pathlib import Path
lessons=json.loads(Path('runtime/lessons.json').read_text())
solutions=json.loads(Path('tests/runtime-solutions.json').read_text())
def run(code,tests=None,values=None):
    # Match the browser: a new harness/module namespace for every case.
    cases=[]
    for test in tests or [None]:
        harness=runpy.run_path('runtime/runner.py')
        request={'code':code,'mode':'validate' if test else 'run','tests':[test] if test else [],'globals':values or {}}
        result=json.loads(harness['_lab_execute_json'](json.dumps(request)))
        cases.extend(result['cases'])
        if result['status'] not in ('success','tests_failed'):return result
    if tests:result.update(cases=cases,status='success' if all(c['passed'] for c in cases) else 'tests_failed')
    return result
for lesson in lessons:
    code=solutions[lesson['id']]
    correct=run(code,lesson['tests']);assert correct['status']=='success',(lesson['id'],correct)
    assert run(code,values=lesson['demoGlobals'])['status']=='success'
    assert code==''.join(lesson['blocks'])
    wrong=[]
    for patch in lesson['patches']:
        variant=lesson['template'].replace('___',patch['code'])
        result=run(variant,lesson['tests'])
        if variant==code:assert result['status']=='success'
        else:assert result['status']!='success',(lesson['id'],patch);wrong.append(variant)
    assert len(wrong)==2
# Different, equivalent implementations must pass: real behavior, not text matching.
assert run('score = 0.1 + base_score',lessons[0]['tests'])['status']=='success'
assert run('def double_tokens(value):\n    return value + value',lessons[3]['tests'])['status']=='success'
assert run('score = 0.6',lessons[0]['tests'])['status']=='tests_failed'
assert run('accepted = "True"',lessons[2]['tests'])['status']=='tests_failed'
assert run('print(1/0)')['error']['type']=='ZeroDivisionError'
assert run('if True print(1)')['status']=='syntax_error'
assert run('assert False')['status']=='assertion_error'
print(f'PASS CPython {sys.version.split()[0]}: {len(lessons)} complete solutions, {sum(len(l["tests"]) for l in lessons)} cases, 28 rejected repairs, alternate solutions, real errors and fresh namespaces')
