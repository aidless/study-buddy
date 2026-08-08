# -*- coding: utf-8 -*-
"""解析 408 综合应用题 v2：兼容独立答案区与内联解答"""
import io, re, os, json, glob

TXT = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\recovery\408txt'
OUT = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'
SUBJ = {41: '数据结构', 42: '数据结构', 43: '计算机组成', 44: '计算机组成', 45: '操作系统', 46: '操作系统', 47: '计算机网络'}

def clean(s):
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()

Q_RE = re.compile(r'(?m)^\s*4([1-7])\s*[.．、](?:\s*\(?(\d+)\s*分\)?\s*)?')
A_RE = re.compile(r'(?m)^\s*4([1-7])\s*[.．、]\s*(?:解析|解答|答案要点|答案|参考|答)[:：]?')

def parse_year(year, txt):
    txt = clean(txt)
    # 定位大题区域：从第一个 综合应用题/大题 标记开始
    m0 = re.search(r'综合应用题|大题', txt)
    if not m0:
        return []
    body = txt[m0.start():]
    # 找到答案区：第二个 综合应用题 或 参考答案
    ans_start = None
    m2 = list(re.finditer(r'综合应用题', body))
    if len(m2) >= 2:
        ans_start = m2[1].start()
    else:
        mr = body.find('参考答案')
        if mr >= 0:
            ans_start = mr
    q_region = body[:ans_start] if ans_start is not None else body
    a_region = body[ans_start:] if ans_start is not None else ''
    # 题干切分
    qs = {}
    q_marks = list(Q_RE.finditer(q_region))
    for i, m in enumerate(q_marks):
        no = 40 + int(m.group(1))
        end = q_marks[i+1].start() if i + 1 < len(q_marks) else len(q_region)
        seg = q_region[m.end():end]
        # 内联解答？
        stem = seg
        answer = ''
        dm = re.search(r'解答[:：]|答案[:：]|参考答案[:：]', seg)
        if dm:
            stem = seg[:dm.start()]
            answer = seg[dm.end():]
        stem = stem.strip()
        if stem:
            qs[no] = {'stem': stem, 'answer': answer.strip()}
    # 独立答案区切分
    if a_region:
        a_marks = list(A_RE.finditer(a_region))
        for i, m in enumerate(a_marks):
            no = 40 + int(m.group(1))
            end = a_marks[i+1].start() if i + 1 < len(a_marks) else len(a_region)
            body_txt = a_region[m.end():end].strip()
            if no in qs and not qs[no]['answer']:
                qs[no]['answer'] = body_txt
            elif no not in qs and body_txt:
                qs[no] = {'stem': '', 'answer': body_txt}
    out = []
    for no in range(41, 48):
        if no not in qs or not qs[no].get('stem'):
            continue
        ans = qs[no].get('answer', '')
        out.append({
            'id': f'es{year}_{no}', 'year': year, 'subject': SUBJ[no], 'type': 'essay', 'no': no,
            'stem': qs[no]['stem'],
            'parts': [{'no': '', 'prompt': '', 'answer': ans}],
            'analysis': ans, 'tags': [SUBJ[no]]
        })
    return out

all_essays = []
for p in sorted(glob.glob(TXT + r'\*.txt')):
    year = int(re.search(r'(\d{4})', os.path.basename(p)).group(1))
    txt = io.open(p, encoding='utf-8').read()
    es = parse_year(year, txt)
    print(year, '->', len(es), 'ans:', sum(1 for e in es if len(e['analysis']) > 10))
    all_essays.extend(es)
all_essays.sort(key=lambda e: (e['year'], e['no']))
print('TOTAL', len(all_essays))
io.open(os.path.join(OUT, 'qbankEssay_raw.json'), 'w', encoding='utf-8').write(json.dumps(all_essays, ensure_ascii=False))