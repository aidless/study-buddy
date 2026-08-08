# -*- coding: utf-8 -*-
"""harvest_408.py v3 —— 兼容空 data-tags 与多段题干，重抓 2026"""
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
        seg_start = m.end()
        seg_end = tokens[i+1].start() if i + 1 < len(tokens) else len(html)
        seg = html[seg_start:seg_end]
        # 题干：h5 之后、choice-container 之前的所有 <p> 拼接
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
        q = {'id': f'q{year}_{SUBJ_KEYS[cur_subj]}{no:02d}', 'year': year, 'subject': cur_subj, 'type': 'choice', 'no': no,
             'stem': stem, 'options': opts, 'answer': ans, 'analysis': analysis, 'tags': tags}
        qs.append(q)
    return qs

# 重抓 2026（覆盖缓存里的解析结果）
html = io.open(os.path.join(cache, '2026.html'), encoding='utf-8', errors='ignore').read()
qs = parse_year(2026, html)
print('2026 parsed:', len(qs))
# 合并到 raw json
raw_path = os.path.join(out_root, 'qbankSeed_raw.json')
raw = json.load(io.open(raw_path, encoding='utf-8'))
raw = [q for q in raw if q['year'] != 2026]
raw.extend(qs)
raw.sort(key=lambda q: (q['year'], q['no']))
io.open(raw_path, 'w', encoding='utf-8').write(json.dumps(raw, ensure_ascii=False))
print('raw total:', len(raw))
# 顺便重扫所有年份，看看是否还有其他年份少题
for year in range(2009, 2027):
    p = os.path.join(cache, f'{year}.html')
    if not os.path.exists(p): continue
    h = io.open(p, encoding='utf-8', errors='ignore').read()
    n = len(parse_year(year, h))
    if n != 40:
        print('  year', year, '->', n)