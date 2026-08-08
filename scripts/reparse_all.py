# -*- coding: utf-8 -*-
"""全量重解析 2009-2026 + 生成 SEED 文件"""
import io, re, json, os
cache = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\recovery\pages'
out_root = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'
SUBJ_MAP = {'数据结构': '数据结构', '组成原理': '计算机组成', '操作系统': '操作系统', '计算机网络': '计算机网络'}
SUBJ_KEYS = {'数据结构': 'ds', '计算机组成': 'co', '操作系统': 'os', '计算机网络': 'net'}

def strip_tags(s):
    s = re.sub(r'<[^>]+>', ' ', s)
    for a, b in [('&nbsp;',' '), ('&amp;','&'), ('&lt;','<'), ('&gt;','>'), ('&quot;','"'), ('&#39;',"'")]:
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip()

def parse_year(year, html):
    qs = []
    tokens = list(re.finditer(r'<h4 id=[^>]*>([^<]+)</h4>|<h5 id="?(\d+)"?>\s*(\d+)\s*</h5>', html))
    cur_subj = None
    for i, m in enumerate(tokens):
        if m.group(1) is not None:
            cur_subj = SUBJ_MAP.get(m.group(1).strip())
            continue
        no = int(m.group(2) or m.group(3))
        if not cur_subj: continue
        seg = html[m.end(): tokens[i+1].start() if i + 1 < len(tokens) else len(html)]
        stem_parts = re.findall(r'<p>(?P<stem>[\s\S]*?)</p>', seg)
        stem = ' '.join(strip_tags(s) for s in stem_parts)
        cm = re.search(r'<div class="choice-container[^>]*data-answer=(?P<ans>[A-D])(?:[^>]*data-tags(?:=(?P<tags>[^\s>]+))?)?[^>]*>(?P<body>[\s\S]*?)(?=<div class=quiz-actions|<div class="quiz-actions)', seg, re.S)
        if not cm: continue
        ans = cm.group('ans')
        tags = [t.strip() for t in re.split(r'[\s,+]', cm.group('tags') or '') if t.strip()]
        body = cm.group('body')
        opts = []
        for om in re.finditer(r'<span class=choice-label>([A-D])\.</span>\s*<span class=choice-text>([\s\S]*?)</span>', body, re.S):
            opts.append(strip_tags(om.group(2)))
        em = re.search(r'<div class=explanation id=[^>]*>(?P<exp>[\s\S]*?)</div>', seg, re.S)
        analysis = strip_tags(em.group('exp')) if em else ''
        analysis = re.sub(r'^正确答案：[A-D]\s*', '', analysis).strip()
        if not opts:
            opts = ['（图 A）', '（图 B）', '（图 C）', '（图 D）']
        qs.append({'id': f'q{year}_{SUBJ_KEYS[cur_subj]}{no:02d}', 'year': year, 'subject': cur_subj, 'type': 'choice', 'no': no,
                   'stem': stem, 'options': opts, 'answer': ans, 'analysis': analysis, 'tags': tags})
    return qs

all_q = []
for year in range(2009, 2027):
    p = os.path.join(cache, f'{year}.html')
    if not os.path.exists(p):
        print('MISSING page', year); continue
    html = io.open(p, encoding='utf-8', errors='ignore').read()
    qs = parse_year(year, html)
    print(year, '->', len(qs))
    all_q.extend(qs)
print('TOTAL', len(all_q))
io.open(os.path.join(out_root, 'qbankSeed_raw.json'), 'w', encoding='utf-8').write(json.dumps(all_q, ensure_ascii=False))
print('raw saved')