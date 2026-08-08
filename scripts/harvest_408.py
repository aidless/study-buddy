# -*- coding: utf-8 -*-
"""harvest_408.py v2 —— 顺序扫描 h4(科目) + h5(题号)，解析选择题"""
import urllib.request, re, io, json, os, time, collections

OUT = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'
CACHE = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\recovery\pages'
os.makedirs(CACHE, exist_ok=True)
SUBJ_MAP = {'数据结构': '数据结构', '组成原理': '计算机组成', '操作系统': '操作系统', '计算机网络': '计算机网络'}
SUBJ_KEYS = {'数据结构': 'ds', '计算机组成': 'co', '操作系统': 'os', '计算机网络': 'net'}

def fetch(year):
    p = os.path.join(CACHE, f'{year}.html')
    if os.path.exists(p):
        return io.open(p, encoding='utf-8', errors='ignore').read()
    url = f'https://www.csgraduates.com/study_methods/408quiz/{year}/'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    for attempt in range(4):
        try:
            html = urllib.request.urlopen(req, timeout=40).read().decode('utf-8', 'ignore')
            io.open(p, 'w', encoding='utf-8').write(html)
            return html
        except Exception as e:
            print('  retry', attempt, e)
            time.sleep(3)
    return None

def strip_tags(s):
    s = re.sub(r'<[^>]+>', '', s)
    for a, b in [('&nbsp;',' '), ('&amp;','&'), ('&lt;','<'), ('&gt;','>'), ('&quot;','"'), ('&#39;',"'"), ('&nbsp;',' ')]:
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip()

def parse_year(year, html):
    qs = []
    # sequential scan
    tokens = list(re.finditer(r'<h4 id=[^>]*>([^<]+)</h4>|<h5 id="?(\d+)"?>\s*(\d+)\s*</h5>', html))
    cur_subj = None
    for i, m in enumerate(tokens):
        if m.group(1) is not None:
            cur_subj = SUBJ_MAP.get(m.group(1).strip())
            continue
        no = int(m.group(2) or m.group(3))
        if not cur_subj:
            continue
        seg_start = m.end()
        seg_end = tokens[i+1].start() if i + 1 < len(tokens) else len(html)
        seg = html[seg_start:seg_end]
        stem_m = re.search(r'<p>(?P<stem>[\s\S]*?)</p>', seg)
        stem = strip_tags(stem_m.group('stem')) if stem_m else ''
        cm = re.search(r'<div class="choice-container[^>]*data-answer=(?P<ans>[A-D])[^>]*data-tags=(?P<tags>[^\s>]+)[^>]*>(?P<body>[\s\S]*?)(?=<div class=quiz-actions|<div class="quiz-actions)', seg, re.S)
        if not cm:
            continue
        ans = cm.group('ans')
        tags = [t.strip() for t in re.split(r'[\s,+]', cm.group('tags')) if t.strip()]
        body = cm.group('body')
        opts = []
        for om in re.finditer(r'<span class=choice-label>([A-D])\.</span>\s*<span class=choice-text>([\s\S]*?)</span>', body, re.S):
            opts.append(strip_tags(om.group(2)))
        em = re.search(r'<div class=explanation id=[^>]*>(?P<exp>[\s\S]*?)</div>', seg, re.S)
        analysis = strip_tags(em.group('exp')) if em else ''
        analysis = re.sub(r'^正确答案：[A-D]\s*', '', analysis).strip()
        q = {
            'id': f'q{year}_{SUBJ_KEYS[cur_subj]}{no:02d}',
            'year': year, 'subject': cur_subj, 'type': 'choice', 'no': no,
            'stem': stem, 'options': opts, 'answer': ans, 'analysis': analysis, 'tags': tags
        }
        qs.append(q)
    return qs

all_q = []
for year in range(2009, 2027):
    html = fetch(year)
    if not html:
        print('FAILED', year); continue
    qs = parse_year(year, html)
    print(year, '->', len(qs))
    all_q.extend(qs)
    time.sleep(0.5)

print('TOTAL', len(all_q))
print('by_year:', dict(sorted(collections.Counter(q['year'] for q in all_q).items())))
print('by_subj:', dict(collections.Counter(q['subject'] for q in all_q)))
bad = [q for q in all_q if len(q['options']) != 4 or q['answer'] not in 'ABCD' or not q['stem']]
print('bad:', len(bad))
if all_q:
    io.open(OUT + r'\qbankSeed_raw.json', 'w', encoding='utf-8').write(json.dumps(all_q, ensure_ascii=False))
    print('saved raw json, sample:')
    print(json.dumps(all_q[0], ensure_ascii=False)[:300])