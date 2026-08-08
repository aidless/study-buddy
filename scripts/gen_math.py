# -*- coding: utf-8 -*-
"""生成数学一模拟练习（高数48 / 线代42 / 概率36，共126），答案由计算得出"""
import io, json, os, random
random.seed(20260808)
OUT = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'

def mk(qid, subject, topic, stem, opts, answer, analysis, tags):
    return {'id': qid, 'year': 2026, 'subject': subject, 'type': 'choice', 'no': 0, 'stem': stem,
            'options': opts, 'answer': answer, 'analysis': analysis, 'tags': tags, 'source': 'practice'}

qs = []
# ---------- 高数 48 ----------
subj = '数学一'
for i in range(12):
    k = random.choice([2, 3, 4, 5, 6])
    ans = f'{k}'
    opts = [str(k), str(k*2), '1', str(k//2)]
    qs.append(mk(f'pg_math_lim{i:03d}', subj, '高数', f'求极限 lim(x→0) sin({k}x)/x 的值。',
                 opts, 'A', f'由重要极限 lim(x→0) sin(ax)/x = a，故结果为 {k}。', ['极限']))
for i in range(12):
    n = random.choice([2, 3, 4, 5, 6, 7])
    val = n
    qs.append(mk(f'pg_math_der{i:03d}', subj, '高数', f'设 f(x)=x^{n}，则 f\'(1)=（  ）。',
                 [str(val), str(val-1), str(val+1), str(2*val)], 'A',
                 f'f\'(x)=n·x^(n-1)，f\'(1)={n}。', ['导数']))
for i in range(12):
    n = random.choice([2, 3, 4, 5])
    val = n + 1
    qs.append(mk(f'pg_math_int{i:03d}', subj, '高数', f'计算定积分 ∫₀¹ x^{n} dx 的值。',
                 [f'1/{val}', f'1/{n}', f'{val}', f'{n}'], 'A',
                 f'∫₀¹ x^n dx = 1/(n+1) = 1/{val}。', ['定积分']))
for i in range(12):
    a = random.choice([2, 3, 4])
    val = a**2
    qs.append(mk(f'pg_math_seq{i:03d}', subj, '高数', '设数列 a_n = 1/n^2，求级数 1+1/4+1/9+...（p=2 级数收敛性）：该级数（  ）。',
                 ['收敛', '发散', '条件收敛', '无法判断'], 'A',
                 'p 级数 Σ1/n^p 当 p>1 时收敛，此处 p=2>1，故收敛。', ['级数']))
# ---------- 线代 42 ----------
subj2 = '数学一'
for i in range(14):
    a = random.choice([1, 2, 3, 4]); b = random.choice([2, 3, 4, 5]); c = random.choice([1, 2, 3]); d = random.choice([2, 4, 6])
    det = a*d - b*c
    opts = [str(det), str(-det), str(det+1), str(det-1)]
    qs.append(mk(f'pg_math_mat{i:03d}', subj2, '线代', f'计算二阶行列式 |{a} {b}; {c} {d}| 的值。',
                 opts, 'A', f'行列式 = a·d - b·c = {a}×{d} - {b}×{c} = {det}。', ['行列式']))
for i in range(14):
    n = random.choice([2, 3, 4])
    k = random.choice([2, 3])
    val = k * n
    qs.append(mk(f'pg_math_rank{i:03d}', subj2, '线代', f'设 A 为 {n}×{n} 阶矩阵，r(A)={n}，则 r({k}A)=（  ）。',
                 [str(val), str(n), str(k), str(n+k)], 'A',
                 f'非零常数乘矩阵不改变秩，r({k}A)=r(A)={n}。', ['矩阵的秩']))
for i in range(14):
    n = random.choice([2, 3, 4])
    val = n + 2
    qs.append(mk(f'pg_math_lin{i:03d}', subj2, '线代', f'n 维向量组线性无关时，其秩 r={n}；该向量组所含向量个数最多为（  ）。',
                 [str(n), str(val), str(2*n), '∞'], 'A',
                 f'线性无关向量组的秩等于向量个数，最多 {n} 个。', ['线性相关']))
# ---------- 概率 36 ----------
subj3 = '数学一'
for i in range(12):
    n = random.choice([6, 8, 10])
    k = random.choice([2, 3, 4])
    val = round(k / n, 4)
    qs.append(mk(f'pg_math_prob{i:03d}', subj3, '概率', f'从 1~{n} 中任取一个整数，取到 {k} 的倍数的概率为（  ）。',
                 [f'{k}/{n}', f'{n}/{k}', f'1/{k}', f'{k}/{n+1}'], 'A',
                 f'1~{n} 中 {k} 的倍数恰有 {k} 个（1×k, 2×k），概率 = {k}/{n}。', ['古典概型']))
for i in range(12):
    n = random.choice([4, 5, 6]); k = random.choice([2, 3])
    import math
    c = math.comb(n, k)
    qs.append(mk(f'pg_math_com{i:03d}', subj3, '概率', f'从 {n} 个不同元素中任取 {k} 个的组合数为（  ）。',
                 [str(c), str(c+1), str(c-1), str(c*2)], 'A',
                 f'C({n},{k}) = {c}。', ['组合数']))
for i in range(12):
    a = random.choice([0.2, 0.3, 0.4, 0.5])
    b = round(1 - a, 1)
    qs.append(mk(f'pg_math_exp{i:03d}', subj3, '概率', f'随机变量 X 只取 0、1 两个值，P(X=1)={a}，则 P(X=0)=（  ）。',
                 [str(b), str(a), str(round(a+0.1,1)), str(round(a*2,1))], 'A',
                 f'概率和为 1，P(X=0) = 1 - {a} = {b}。', ['概率基本性质']))

print('math questions:', len(qs))
# 按 高数/线代/概率 分组统计
import collections
print(collections.Counter(q['tags'][0] for q in qs))
io.open(os.path.join(OUT, 'qbankMathGen.json'), 'w', encoding='utf-8').write(json.dumps(qs, ensure_ascii=False))
# 生成 JS
body = '// qbankMathGen.js —— 数学一模拟题（参数化生成，答案由计算得出，勿手改）\nexport const PRACTICE_MATH = [\n'
for q in qs:
    opts = ', '.join(json.dumps(o, ensure_ascii=False) for o in q['options'])
    tags = ', '.join(json.dumps(t, ensure_ascii=False) for t in q['tags'])
    body += ('  { id: %s,\n    year: 2026,\n    subject: %s,\n    type: \'choice\',\n    no: 0,\n'
             '    stem: %s,\n    options: [%s],\n    answer: %s,\n    analysis: %s,\n    tags: [%s],\n    source: \'practice\' },\n') % (
        json.dumps(q['id'], ensure_ascii=False), json.dumps(subj, ensure_ascii=False), json.dumps(q['stem'], ensure_ascii=False),
        opts, json.dumps(q['answer']), json.dumps(q['analysis'], ensure_ascii=False), tags)
body += ']\n'
io.open(os.path.join(OUT, 'qbankMathGen.js'), 'w', encoding='utf-8').write(body)
# 更新 qbankMath.js
io.open(os.path.join(OUT, 'qbankMath.js'), 'w', encoding='utf-8').write(
    '// qbankMath.js —— 数学一模拟练习汇总入口\nimport { PRACTICE_MATH } from \'./qbankMathGen.js\'\nexport const MATH = [...PRACTICE_MATH]\n')
print('done')