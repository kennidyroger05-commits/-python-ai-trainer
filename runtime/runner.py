# Trusted harness. Learner programs run in a separate namespace and a fresh worker per request.
import ast as _ast
import builtins as _builtins
import contextlib as _contextlib
import io as _io
import json as _json
import math as _math
import traceback as _traceback

_json_dumps, _json_loads, _isclose = _json.dumps, _json.loads, _math.isclose

_ALLOWED_IMPORTS = {'json', 'math', 're', 'statistics', 'collections', 'itertools', 'functools', 'decimal'}
_ALLOWED_BUILTINS = ('print len max min sum range zip enumerate sorted reversed str int float bool list dict set tuple all any isinstance type abs round repr Exception ValueError TypeError KeyError IndexError NameError RuntimeError AssertionError ZeroDivisionError StopIteration ImportError AttributeError'.split())
_SAFE = {name: getattr(_builtins, name) for name in _ALLOWED_BUILTINS}

def _import(name, globals=None, locals=None, fromlist=(), level=0):
    if level or name.split('.')[0] not in _ALLOWED_IMPORTS:
        raise ImportError('This local learning runtime does not allow module: ' + name)
    return _builtins.__import__(name, globals, locals, fromlist, level)
_SAFE['__import__'] = _import

class _Output(_io.TextIOBase):
    def __init__(self): self.parts = []; self.count = 0; self.truncated = False
    def write(self, value):
        value = str(value); remaining = max(0, 32768 - self.count)
        if remaining: self.parts.append(value[:remaining]); self.count += min(remaining, len(value))
        if len(value) > remaining: self.truncated = True
        return len(value)
    def text(self): return ''.join(self.parts) + ('\n[output limited to 32768 characters]' if self.truncated else '')

def _equal(a, b):
    if isinstance(a, bool) or isinstance(b, bool): return type(a) is type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)): return _isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    if type(a) is not type(b): return False
    if isinstance(a, dict): return a.keys() == b.keys() and all(_equal(a[k], b[k]) for k in a)
    if isinstance(a, list): return len(a) == len(b) and all(_equal(x,y) for x,y in zip(a,b))
    return a == b

def _encode(value):
    try:
        encoded = _json_dumps(value, allow_nan=False)
        if len(encoded)>4000: return {'preview':encoded[:4000],'truncated':True}
        return _json_loads(encoded)
    except (ValueError, TypeError): return {'python_type': type(value).__name__}

def _lab_execute_json(payload):
    request = _json_loads(payload); code = request['code']; out = _Output(); err = _Output()
    result = {'status':'success', 'stdout':'', 'stderr':'', 'cases':[], 'error':None, 'pythonVersion':_builtins.__import__('sys').version.split()[0]}
    try:
        tree = _ast.parse(code, filename='<learner>')
        for node in _ast.walk(tree):
            if isinstance(node, (_ast.Import, _ast.ImportFrom)):
                names = [n.name for n in node.names] if isinstance(node, _ast.Import) else [node.module or '']
                if getattr(node, 'level', 0) or any(n.split('.')[0] not in _ALLOWED_IMPORTS for n in names):
                    result.update(status='policy_error', error={'type':'ImportPolicy','message':'Only documented standard-library modules are available.'}); return _json_dumps(result)
            if isinstance(node, _ast.Attribute) and node.attr.startswith('__'):
                result.update(status='policy_error', error={'type':'AttributePolicy','message':'Internal attributes and browser bridges are not available.'}); return _json_dumps(result)
        compiled = compile(tree, '<learner>', 'exec')
        tests = request.get('tests', []) if request.get('mode') == 'validate' else []
        runs = tests or [None]
        for spec in runs:
            namespace = {'__builtins__':dict(_SAFE), '__name__':'__learner__'}
            namespace.update(spec.get('globals', {}) if spec else request.get('globals', {}))
            local_out = _Output(); local_err = _Output(); observed = None; comparing_result = False
            try:
                with _contextlib.redirect_stdout(local_out), _contextlib.redirect_stderr(local_err):
                    exec(compiled, namespace, namespace)
                    if spec:
                        if spec['kind'] == 'call':
                            if spec['function'] not in namespace: raise NameError('Required function is not defined: ' + spec['function'])
                            observed = namespace[spec['function']](*spec.get('args', []))
                        elif spec['kind'] == 'variable':
                            if spec['name'] not in namespace: raise NameError('Required variable is not defined: ' + spec['name'])
                            observed = namespace[spec['name']]
                        elif spec['kind'] == 'stdout': observed = local_out.text()
                        else: raise ValueError('Unknown registered test kind')
                        # This is an actual Python assertion, not a source-text check.
                        comparing_result = True
                        assert _equal(observed, spec['expected']), 'Observed result differs from the registered expected result'
            except AssertionError as exception:
                if spec:
                    result['cases'].append({'id':spec['id'],'passed':False,'kind':'wrong_result' if comparing_result else 'assertion_error','observed':_encode(observed),'error':{'type':'AssertionError','message':str(exception)[:2000]}})
                    if not comparing_result: local_err.write(''.join(_traceback.format_exception(exception)))
                else: result.update(status='assertion_error',error={'type':'AssertionError','message':str(exception)[:2000]});local_err.write(''.join(_traceback.format_exception(exception)))
            except Exception as exception:
                error = {'type':type(exception).__name__,'message':str(exception)[:2000]}
                local_err.write(''.join(_traceback.format_exception(exception)))
                if spec: result['cases'].append({'id':spec['id'],'passed':False,'kind':'runtime_error','error':error})
                else: result.update(status='runtime_error',error=error)
            else:
                if spec: result['cases'].append({'id':spec['id'],'passed':True,'kind':'passed','observed':_encode(observed)})
            out.write(local_out.text());err.write(local_err.text())
        if tests and not all(t['passed'] for t in result['cases']): result['status']='tests_failed'
    except SyntaxError as exception:
        result.update(status='syntax_error',error={'type':'SyntaxError','message':str(exception)[:2000]})
        err.write(''.join(_traceback.format_exception(exception)))
    except Exception as exception:
        result.update(status='runtime_error',error={'type':type(exception).__name__,'message':str(exception)[:2000]})
        err.write(''.join(_traceback.format_exception(exception)))
    result['stdout']=out.text();result['stderr']=err.text()
    return _json_dumps(result, ensure_ascii=False)
