"""Tiny real softmax classifier using only the Python standard library.

This is a linear text model, not an LLM. Scores are not calibrated confidence.
Training data and checkpoints are public educational fixtures, never pickle.
"""
import copy
import hashlib
import json
import math
import random
import re

LABELS = ['billing', 'support', 'schedule']
TOKENIZER = 'lower-ascii-words-v1'

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)

def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()

def tokenize(text):
    if not isinstance(text, str) or len(text) > 512:
        raise ValueError('Input must be a string with at most 512 characters')
    return re.findall(r'[a-z]+', text.lower())

def validate_dataset(data):
    if set(data) != {'version', 'id', 'examples'} or data['version'] != 1:
        raise ValueError('Invalid dataset schema')
    rows=data['examples']
    if not isinstance(rows,list) or not 9 <= len(rows) <= 2048:
        raise ValueError('Dataset size outside the educational budget')
    ids=set(); texts=set()
    for row in rows:
        if set(row)!={'id','text','label','split'} or row['label'] not in LABELS or row['split'] not in ['train','validation','test']:
            raise ValueError('Invalid dataset row')
        if row['id'] in ids or row['text'].lower() in texts:
            raise ValueError('Duplicate id/text leaks examples across splits')
        ids.add(row['id']);texts.add(row['text'].lower());tokenize(row['text'])
    for split in ['train','validation','test']:
        if {row['label'] for row in rows if row['split']==split}!=set(LABELS):
            raise ValueError('Every split must contain all classes')
    return data

def initialize(rows, seed):
    vocab=sorted({word for row in rows for word in tokenize(row['text'])})
    if not vocab or len(vocab)>4096:raise ValueError('Invalid vocabulary size')
    rng=random.Random(seed)
    return {'version':1,'kind':'tiny-intent-softmax','tokenizer':TOKENIZER,'labels':LABELS[:], 'vocab':vocab,
            'weights':[[rng.uniform(-.01,.01) for _ in vocab] for _ in LABELS], 'bias':[0.0]*len(LABELS)}

def validate_model(model):
    if set(model)!={'version','kind','tokenizer','labels','vocab','weights','bias'} or model['version']!=1 or model['kind']!='tiny-intent-softmax' or model['tokenizer']!=TOKENIZER or model['labels']!=LABELS:
        raise ValueError('Invalid model schema')
    vocab=model['vocab']
    if not isinstance(vocab,list) or not 1<=len(vocab)<=4096 or vocab!=sorted(set(vocab)) or not all(isinstance(w,str) and re.fullmatch('[a-z]+',w) for w in vocab):
        raise ValueError('Invalid vocabulary')
    if len(model['weights'])!=len(LABELS) or len(model['bias'])!=len(LABELS) or any(len(row)!=len(vocab) for row in model['weights']):
        raise ValueError('Incompatible model dimensions')
    values=model['bias']+[v for row in model['weights'] for v in row]
    if not all(type(v) in [int,float] and math.isfinite(v) and abs(v)<1e6 for v in values):
        raise ValueError('Nonfinite/unbounded model parameter')
    return model

def features(model, text):
    indexes={word:i for i,word in enumerate(model['vocab'])}; result={}
    for word in tokenize(text):
        if word in indexes:result[indexes[word]]=result.get(indexes[word],0)+1
    return result

def probabilities(model, text):
    values=features(model,text)
    logits=[b+sum(model['weights'][k][j]*count for j,count in values.items()) for k,b in enumerate(model['bias'])]
    peak=max(logits);exps=[math.exp(v-peak) for v in logits];total=sum(exps)
    return [v/total for v in exps]

def predict(model,text):
    scores=probabilities(model,text);index=max(range(len(scores)),key=scores.__getitem__)
    return {'label':model['labels'][index], 'scores':dict(zip(model['labels'],scores)), 'word_tokens':len(tokenize(text))}

def evaluate(model, rows):
    if not rows:raise ValueError('Cannot evaluate an empty dataset')
    correct=0;loss=0
    for row in rows:
        values=probabilities(model,row['text']);target=model['labels'].index(row['label'])
        correct+=max(range(len(values)),key=values.__getitem__)==target;loss-=math.log(max(values[target],1e-15))
    return {'accuracy':correct/len(rows),'loss':loss/len(rows),'correct':correct,'examples':len(rows)}

def train(data, config, event=lambda row:None):
    validate_dataset(data)
    if set(config)!={'seed','epochs','batch_size','learning_rate'} or type(config['seed']) is not int or not 0<=config['seed']<2**31 or type(config['epochs']) is not int or not 1<=config['epochs']<=100 or type(config['batch_size']) is not int or not 1<=config['batch_size']<=16 or type(config['learning_rate']) not in [int,float] or not math.isfinite(config['learning_rate']) or not .001<=config['learning_rate']<=1:
        raise ValueError('Invalid bounded training configuration')
    rows={split:[r for r in data['examples'] if r['split']==split] for split in ['train','validation','test']}
    model=initialize(rows['train'],config['seed']);rng=random.Random(config['seed'])
    before=evaluate(model,rows['validation']);history=[];best=None;best_loss=math.inf;best_epoch=None
    for epoch in range(1,config['epochs']+1):
        order=rows['train'][:];rng.shuffle(order)
        for start in range(0,len(order),config['batch_size']):
            batch=order[start:start+config['batch_size']];gw=[[0.0]*len(model['vocab']) for _ in LABELS];gb=[0.0]*len(LABELS)
            for row in batch:
                x=features(model,row['text']);values=probabilities(model,row['text']);target=LABELS.index(row['label'])
                for k in range(len(LABELS)):
                    error=values[k]-(k==target);gb[k]+=error
                    for j,count in x.items():gw[k][j]+=error*count
            rate=config['learning_rate']/len(batch)
            for k in range(len(LABELS)):
                model['bias'][k]-=rate*gb[k]
                for j in range(len(model['vocab'])):model['weights'][k][j]-=rate*gw[k][j]
        training=evaluate(model,rows['train']);validation=evaluate(model,rows['validation'])
        row={'event':'epoch','epoch':epoch,'training_loss':training['loss'],'validation_loss':validation['loss'],'validation_accuracy':validation['accuracy']};history.append(row);event(row)
        if validation['loss']<best_loss:best=copy.deepcopy(model);best_loss=validation['loss'];best_epoch=epoch
    # Test examples are not used to build vocabulary or select the checkpoint.
    return {'model':validate_model(best),'history':history,'selected_epoch':best_epoch,'before_validation':before,
            'after_validation':evaluate(best,rows['validation']),'heldout_test':evaluate(best,rows['test']),
            'splits':{split:[row['id'] for row in rows[split]] for split in rows}}
