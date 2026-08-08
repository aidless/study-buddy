# -*- coding: utf-8 -*-
"""生成数学一解答题（高数 8 / 线代 8 / 概率 8，带详细解答）"""
import io, os, json
OUT = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'

probs = [
 ('高数', '计算极限 lim(x→0) sin(3x)/x。',
  '由重要极限 lim(x→0) sin x / x = 1，得 lim(x→0) sin(3x)/x = lim(x→0) 3·sin(3x)/(3x) = 3·1 = 3。答案：3。'),
 ('高数', '设 y = x²·eˣ，求 dy/dx。',
  u'由乘积法则求导：(x²·eˣ)的导数为 2x·eˣ + x²·eˣ = x·eˣ(x+2)。答案：dy/dx = x·eˣ(x+2)。'),
 ('高数', '计算不定积分 ∫ x·eˣ dx。',
  '分部积分：令 u=x, dv=eˣdx，则 du=dx, v=eˣ。∫ x·eˣ dx = x·eˣ − ∫ eˣ dx = (x−1)·eˣ + C。答案：(x−1)eˣ + C。'),
 ('高数', '判定级数 Σ(n=1→∞) 1/n² 的敛散性。',
  '这是 p-级数 Σ1/n^p，p=2>1，由 p-级数判别法知该级数收敛（且收敛到 π²/6）。答案：收敛。'),
 ('高数', '求微分方程 y\' = 2x 满足 y(0)=1 的特解。',
  '两边积分：y = ∫2x dx = x² + C。代入 y(0)=1 得 C=1。答案：y = x² + 1。'),
 ('高数', '求函数 f(x)=x³−3x 的极值。',
  u'求导得 f 的导数为 3x²−3=3(x−1)(x+1)，驻点 x=±1；二阶导数 6x：x=−1 时 <0 取极大 f(−1)=2，x=1 时 >0 取极小 f(1)=−2。答案：极大 f(−1)=2，极小 f(1)=−2。'),
 ('高数', '计算二重积分 ∬_D (x+y) dσ，其中 D={(x,y)|0≤x≤1, 0≤y≤1}。',
  '∬_D (x+y) dxdy = ∫₀¹∫₀¹ (x+y) dy dx = ∫₀¹ (x·1 + 1/2) dx = (1/2 + 1/2) = 1。答案：1。'),
 ('高数', '求曲线 y=x²、x 轴与直线 x=1 所围平面图形的面积。',
  'S = ∫₀¹ x² dx = x³/3 |₀¹ = 1/3。答案：1/3。'),
 ('线代', '解线性方程组：x + y = 3，x − y = 1。',
  '两式相加得 2x=4 → x=2；代入得 y=1。答案：x=2, y=1。'),
 ('线代', '求矩阵 A = [1 2; 3 4] 的行列式。',
  'det A = 1×4 − 2×3 = 4 − 6 = −2。答案：−2。'),
 ('线代', '求矩阵 A = [1 2; 3 4] 的逆矩阵。',
  'det=−2，A⁻¹ = (1/det)·[4 −2; −3 1] = [−2 1; 3/2 −1/2]。答案：A⁻¹ = [−2 1; 1.5 −0.5]。'),
 ('线代', '判断向量组 α₁=(1,0), α₂=(0,1) 是否线性相关。',
  'k₁α₁+k₂α₂=0 即 (k₁,k₂)=0 → k₁=k₂=0，只有零解，故线性无关。答案：线性无关。'),
 ('线代', '求对角矩阵 A = [2 0; 0 3] 的特征值。',
  '特征方程为 det(A−λI)=(2−λ)(3−λ)=0，特征值 λ=2, 3。答案：2 和 3。'),
 ('线代', '判断二次型 f = x₁² + 2x₂² 的正定性。',
  '对应矩阵 [1 0; 0 2]，顺序主子式均为正（1>0, 2>0），故正定。答案：正定二次型。'),
 ('线代', '求矩阵 A = [1 2 3; 2 4 6; 1 1 1] 的秩。',
  '第 2 行 = 2×第 1 行，消去后得 [1 2 3; 0 0 0; 0 −1 −2]，存在 2 个非零行且不成比例，r(A)=2。答案：秩为 2。'),
 ('线代', '求齐次方程组 x + y = 0 的解空间维数。',
  '1 个方程 2 个未知数，基础解系含 2−1=1 个向量，解空间维数为 1。答案：1。'),
 ('概率', '连续抛掷一枚均匀硬币两次，求两次都出现正面的概率。',
  '每次正面概率 1/2，独立：P = (1/2)·(1/2) = 1/4。答案：1/4。'),
 ('概率', '掷一枚均匀骰子，求点数大于 4 的概率。',
  '点数 5、6 满足，共 2 个；P = 2/6 = 1/3。答案：1/3。'),
 ('概率', '盒中有 3 个红球 2 个白球，不放回连取两球，求两球都是红球的概率。',
  'P = (3/5)·(2/4) = 6/20 = 3/10。答案：3/10。'),
 ('概率', '设 X ~ B(4, 0.5)（二项分布），求 E(X)。',
  '二项分布期望 E(X)=np = 4×0.5 = 2。答案：2。'),
 ('概率', '设 X 在 [0, 2] 上服从均匀分布，求 D(X)。',
  '均匀分布 U(a,b) 方差 D(X)=(b−a)²/12 = 4/12 = 1/3。答案：1/3。'),
 ('概率', '设 X ~ N(0, 1)，求 P(X < 0)。',
  '标准正态分布关于 0 对称，P(X<0)=1/2。答案：1/2。'),
 ('概率', '设 X ~ B(n, p)，写出 D(X) 的公式并说明意义。',
  'D(X) = np(1−p)，反映取值偏离期望的波动程度。答案：np(1−p)。'),
 ('概率', '设某设备寿命 X 服从参数 λ=1/1000 的指数分布（单位小时），求平均寿命 E(X)。',
  '指数分布 E(X)=1/λ = 1000 小时。答案：1000 小时。'),
]

def mk(i, tag, stem, answer):
    return {'id': f'pg_mathp_{i:03d}', 'year': 2026, 'subject': '数学一', 'type': 'essay', 'no': 0,
            'stem': stem, 'parts': [{'no': '', 'prompt': '', 'answer': answer}],
            'analysis': answer, 'tags': ['数学解答', tag], 'source': 'practice'}

qs = [mk(i, t, s, a) for i, (t, s, a) in enumerate(probs)]
print('math problems:', len(qs))
body = '// qbankMathProblem.js —— 数学一解答题（高数 8 / 线代 8 / 概率 8，带详细解答，自动生成勿手改）\nexport const MATH_PROBLEMS = [\n'
for q in qs:
    parts = ', '.join('{ no: %s, prompt: %s, answer: %s }' % (json.dumps(p['no'], ensure_ascii=False), json.dumps(p['prompt'], ensure_ascii=False), json.dumps(p['answer'], ensure_ascii=False)) for p in q['parts'])
    tags = ', '.join(json.dumps(t, ensure_ascii=False) for t in q['tags'])
    body += ('  { id: %s,\n    year: 2026,\n    subject: \'数学一\',\n    type: \'essay\',\n    no: 0,\n'
             '    stem: %s,\n    parts: [%s],\n    analysis: %s,\n    tags: [%s],\n    source: \'practice\' },\n') % (
        json.dumps(q['id'], ensure_ascii=False), json.dumps(q['stem'], ensure_ascii=False), parts,
        json.dumps(q['analysis'], ensure_ascii=False), tags)
body += ']\n'
io.open(os.path.join(OUT, 'qbankMathProblem.js'), 'w', encoding='utf-8').write(body)
io.open(os.path.join(OUT, 'qbankMath.js'), 'w', encoding='utf-8').write(
    '// qbankMath.js —— 数学一模拟练习汇总入口\nimport { PRACTICE_MATH } from \'./qbankMathGen.js\'\nimport { MATH_PROBLEMS } from \'./qbankMathProblem.js\'\nexport const MATH = [...PRACTICE_MATH]\nexport const MATH_PROBLEMS = [...MATH_PROBLEMS]\n')
print('qbankMath.js updated')