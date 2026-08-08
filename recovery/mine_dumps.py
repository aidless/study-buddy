import json, io, os, glob, re

sessions = []
for root in [r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\科研\haolo-ai-home\sessions',
             r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\论文\haolo-ai-home\sessions',
             r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\agent\haolo-ai-home\sessions',
             r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\haolo-ai-home\sessions']:
    for p in glob.glob(os.path.join(root, '**', '*.jsonl'), recursive=True):
        try:
            with io.open(p, encoding='utf-8', errors='replace') as f:
                txt = f.read()
        except Exception:
            continue
        if 'study-buddy' in txt or '2026-07-31-21-50-31' in txt:
            sessions.append(p)
print('sessions:', len(sessions))

cands = {}  # header -> (maxlen, string, ts)
def feed(s, ts):
    if not isinstance(s, str) or len(s) < 1500: return
    st = s.lstrip('\ufeff \n\r\t')
    # candidate file dumps
    if not (st.startswith('//') or st.startswith('import ') or st.startswith('export ') or st.startswith('/*')
            or st.startswith('<!doctype') or st.startswith('<!DOCTYPE') or st.startswith('create table')
            or st.startswith('{') or st.startswith('[') or st.startswith('# ')):
        return
    head = st.split('\n', 1)[0][:80]
    if head in cands:
        if len(s) > cands[head][0]:
            cands[head] = (len(s), s, ts)
    else:
        cands[head] = (len(s), s, ts)

for p in sessions:
    name = os.path.basename(p)
    with io.open(p, encoding='utf-8', errors='replace') as f:
        for line in f:
            if '{"' not in line: continue
            try: obj = json.loads(line)
            except Exception: continue
            ts = obj.get('timestamp') or ''
            pl = obj.get('payload') or {}
            def walk(o):
                if isinstance(o, dict):
                    for v in o.values(): yield from walk(v)
                elif isinstance(o, list):
                    for v in o: yield from walk(v)
                elif isinstance(o, str):
                    yield o
            for s in walk(pl):
                feed(s, ts)

print('candidate dumps:', len(cands))
outdir = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\recovery\dumps'
os.makedirs(outdir, exist_ok=True)
big = sorted(cands.values(), key=lambda x: -x[0])
for n, s, ts in big[:60]:
    head = s.lstrip('\ufeff \n\r\t').split('\n', 1)[0][:70].replace('\r','')
    print(f'{n:>7}  {head}')
    # save
    safe = re.sub(r'[^\w\u4e00-\u9fff.-]', '_', head[:50])[:80]
    with io.open(os.path.join(outdir, f'{n}_{safe}.txt'), 'w', encoding='utf-8', newline='') as f:
        f.write(s)
print('saved to', outdir)