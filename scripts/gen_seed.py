# -*- coding: utf-8 -*-
import io, json, os
root = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'
raw = json.load(io.open(os.path.join(root, 'qbankSeed_raw.json'), encoding='utf-8'))
print('raw', len(raw))
# split into A/B/C (2009-2015, 2016-2021, 2022-2025)
def emit(name, qs):
    body = '// 自动生成（harvest_408.py 从 csgraduates.com 采集，勿手改）\n'
    body += f'export const {name} = [\n'
    for q in qs:
        opts = ', '.join(json.dumps(o, ensure_ascii=False) for o in q['options'])
        tags = ', '.join(json.dumps(t, ensure_ascii=False) for t in q['tags'])
        body += ('  { id: %s,\n    year: %d,\n    subject: %s,\n    type: \'choice\',\n    no: %d,\n'
                 '    stem: %s,\n    options: [%s],\n    answer: %s,\n    analysis: %s,\n    tags: [%s] },\n') % (
            json.dumps(q['id'], ensure_ascii=False), q['year'], json.dumps(q['subject'], ensure_ascii=False),
            q['no'], json.dumps(q['stem'], ensure_ascii=False), opts,
            json.dumps(q['answer']), json.dumps(q['analysis'], ensure_ascii=False), tags)
    body += ']\n'
    io.open(os.path.join(root, name + '.js'), 'w', encoding='utf-8').write(body)
    print('wrote', name + '.js', len(qs))

raw.sort(key=lambda q: (q['year'], q['no']))
A = [q for q in raw if q['year'] <= 2015]
B = [q for q in raw if 2016 <= q['year'] <= 2021]
C = [q for q in raw if q['year'] >= 2022]
emit('qbankSeedA', A)
emit('qbankSeedB', B)
emit('qbankSeedC', C)

seed = '// qbankSeed.js —— 408 真题选择题汇总入口\n'
seed += 'import { SEED_QUESTIONS_A } from \'./qbankSeedA.js\'\nimport { SEED_QUESTIONS_B } from \'./qbankSeedB.js\'\nimport { SEED_QUESTIONS_C } from \'./qbankSeedC.js\'\n'
seed += 'export const SEED_QUESTIONS = [...SEED_QUESTIONS_A, ...SEED_QUESTIONS_B, ...SEED_QUESTIONS_C]\n'
years = sorted({q['year'] for q in raw})
seed += 'export const SEED_META = { count: SEED_QUESTIONS.length, years: %s }\n' % json.dumps(years)
io.open(os.path.join(root, 'qbankSeed.js'), 'w', encoding='utf-8').write(seed)
print('wrote qbankSeed.js')