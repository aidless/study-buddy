# -*- coding: utf-8 -*-
"""从 408 PDF 文本解析综合应用题（41-47），生成 qbankEssay*.js"""
import io, re, os, json

TXT = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\recovery\408txt'
OUT = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'
SUBJ = {41: '数据结构', 42: '数据结构', 43: '计算机组成', 44: '计算机组成', 45: '操作系统', 46: '操作系统', 47: '计算机网络'}

def clean(s):
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    s = s.replace('．', '.').replace('（', '(').replace('）', ')')
    return s.strip()

def parse_year(year, txt):
    txt = clean(txt)
    qs = {}
    # 题干部分：从 "41~47" 或 "41.（" 开始，到 "参考答案" / "二、综合应用题" / "综合题" 结束
    m_start = re.search(r'(4[1-7][.~]?[^.]*?分[^.]*)|41\s*[.．]\s*\(?\d+分?', txt)
    start = m_start.start() if m_start else 0
    end_m = re.search(r'参考答案|二、?综合应用题|综合应用', txt[start:])
    q_end = start + end_m.start() if end_m else len(txt)
    q_seg = txt[start:q_end]
    # 按题号切分题干
    q_parts = re.split(r'(?=(?:^|\n)\s*4[1-7]\s*[.．]\s*\(\d+\s*分\))', q_seg)
    for part in q_parts:
        m = re.match(r'\s*4([1-7])\s*[.．]\s*\((\d+)\s*分\)', part)
        if not m:
            continue
        no = 40 + int(m.group(1))
        stem = part[m.end():].strip()
        if stem:
            qs[no] = {'stem': stem}
    # 答案解析：从 "参考答案" 之后找 "4X.解答" 或 "4X．解答"
    ans_start = txt.find('参考答案')
    ans_txt = ''
    if ans_start >= 0:
        ans_txt = txt[ans_start:]
    else:
        a2 = txt.find('二、')
        if a2 >= 0:
            ans_txt = txt[a2:]
    # 答案按题号切分：41.解答 / 41．解答 / 41. 解答 / 41.参考
    ans_parts = re.split(r'(?=(?:^|\n)\s*4[1-7]\s*[.．:：]\s*(?:解答|参考|答))', ans_txt)
    for part in ans_parts:
        m = re.match(r'\s*4([1-7])\s*[.．:：]\s*(?:解答|参考|答)', part)
        if not m:
            continue
        no = 40 + int(m.group(1))
        body = part[m.end():].strip()
        # 去掉尾部下一题的干扰（切分已处理）
        if body:
            if no in qs:
                qs[no]['answer'] = body
            else:
                qs[no] = {'stem': '', 'answer': body}
    # 组装
    out = []
    for no in range(41, 48):
        if no not in qs or not qs[no].get('stem'):
            continue
        q = qs[no]
        essay = {
            'id': f'es{year}_{no}',
            'year': year,
            'subject': SUBJ[no],
            'type': 'essay',
            'no': no,
            'stem': q['stem'],
            'parts': [{'no': '', 'prompt': '', 'answer': q.get('answer', '')}],
            'analysis': q.get('answer', ''),
            'tags': [SUBJ[no]]
        }
        out.append(essay)
    return out

all_essays = []
for f in sorted(os.listdir(TXT)):
    if not f.endswith('.txt'): continue
    year = int(re.search(r'(\d{4})', f).group(1))
    txt = io.open(os.path.join(TXT, f), encoding='utf-8').read()
    es = parse_year(year, txt)
    print(year, '->', len(es), [e['no'] for e in es])
    all_essays.extend(es)
print('TOTAL essays', len(all_essays))
io.open(os.path.join(OUT, 'qbankEssay_raw.json'), 'w', encoding='utf-8').write(json.dumps(all_essays, ensure_ascii=False))
# 检查是否有答案
noans = [e['id'] for e in all_essays if len(e['analysis']) < 10]
print('missing answers:', noans)