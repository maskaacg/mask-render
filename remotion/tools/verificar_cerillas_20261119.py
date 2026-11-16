# segmentos a b c d e f g
SEG={0:'abcdef',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgedc',7:'abc',8:'abcdefg',9:'abcdfg'}
INV={frozenset(v):k for k,v in SEG.items()}
def estado(eq):  # eq=(d1,op,d2,d3)
    d1,op,d2,d3=eq
    return [set(SEG[d1]),{'h','v'} if op=='+' else {'h'},set(SEG[d2]),set(SEG[d3])]
def leer(st):
    try:
        d1=INV[frozenset(st[0])];d2=INV[frozenset(st[2])];d3=INV[frozenset(st[3])]
    except KeyError: return None
    if st[1]=={'h','v'}:op='+'
    elif st[1]=={'h'}:op='-'
    else: return None
    return (d1,op,d2,d3)
def ok(e): return (e[0]+e[2] if e[1]=='+' else e[0]-e[2])==e[3]
POS=[set('abcdefg'),{'h','v'},set('abcdefg'),set('abcdefg')]
def movs(eq):
    st=estado(eq);res=set()
    for i in range(4):
        for s in st[i]:
            for j in range(4):
                for t in POS[j]-st[j]:
                    if i==j and s==t: continue
                    n=[set(x) for x in st]; n[i].discard(s); n[j].add(t)
                    e=leer(n)
                    if e and ok(e): res.add(e)
    return res
out=[]
for a in range(10):
  for op in '+-':
    for b in range(10):
      for c in range(10):
        e=(a,op,b,c)
        if ok(e): continue
        r=movs(e)
        if len(r)==1: out.append((e,r.pop()))
print(len(out))
pass
r=movs((5,'+',7,2)); print('5+7=2 ->',r); assert r=={(9,'-',7,2)}, 'solución no única'; print('ÚNICA: 9-7=2')
