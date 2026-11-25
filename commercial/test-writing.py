"""Reference solutions, never copied into student assets."""
import json
from pathlib import Path
solutions={
 'remaining':lambda total,used:total-used,
 'choose':lambda score:'pro' if score>=.8 else 'lite',
 'clean':lambda text:text.strip().lower(),
 'count_pass':lambda scores:sum(x>=.8 for x in scores),
 'answer':lambda data:data.get('answer','sem resposta'),
 'average':lambda scores:sum(scores)/len(scores) if scores else 0
}
count=0
for lesson in json.loads(Path(__file__).with_name('writing.json').read_text()):
 for case in lesson['tests']:
  assert solutions[case['function']](*case['args'])==case['expected'], (lesson['id'],case['id'])
  count+=1
assert count==18
print(f'{count} Python reference cases passed')
