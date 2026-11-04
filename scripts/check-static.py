"""Local structure/syntax checks, not a claim of full W3C conformance."""
import json, subprocess
from html.parser import HTMLParser
from pathlib import Path
class Check(HTMLParser):
    def __init__(self):super().__init__();self.stack=[];self.ids=set();self.references=[];self.assets=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:assert a['id'] not in self.ids,a['id'];self.ids.add(a['id'])
        if 'for' in a:self.references.append(a['for'])
        if tag=='script':self.assets.append(a['src'])
        if tag=='link' and a.get('rel')=='stylesheet':self.assets.append(a['href'])
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.stack.append(tag)
    def handle_endtag(self,tag):assert self.stack and self.stack.pop()==tag,tag
parser=Check();parser.feed(Path('index.html').read_text());assert not parser.stack
for ref in parser.references:assert ref in parser.ids,ref
for asset in parser.assets:assert Path(asset).is_file(),asset
for path in Path('.').rglob('*.json'):
    if '.git' not in path.parts:json.loads(path.read_text())
for path in Path('.').rglob('*.js'):
    if '.git' not in path.parts and 'vendor' not in path.parts:subprocess.run(['node','--check',str(path)],check=True,capture_output=True)
print('PASS static HTML balanced tags/unique IDs/labels/assets; JSON parse; first-party JavaScript syntax. Not full HTML conformance certification.')
