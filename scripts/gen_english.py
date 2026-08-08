# -*- coding: utf-8 -*-
"""生成英语一模拟练习（阅读 30 + 词汇语法 92，共 122）"""
import io, json, os, random
random.seed(20260808)
OUT = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'

def mk(qid, topic, stem, opts, answer, analysis, tags):
    return {'id': qid, 'year': 2026, 'subject': '英语一', 'type': 'choice', 'no': 0, 'stem': stem,
            'options': opts, 'answer': answer, 'analysis': analysis, 'tags': tags, 'source': 'practice'}

qs = []
# ---------- 词汇语法 92 ----------
vocab = [
    ('abandon', 'give up completely', '放弃；抛弃', 'abandon', 'abide', 'abolish', 'absorb'),
    ('ambiguous', 'having more than one possible meaning', '模棱两可的', 'ambiguous', 'amiable', 'anonymous', 'autonomous'),
    ('comprehensive', 'complete and including everything', '全面的', 'comprehensive', 'compulsory', 'controversial', 'confidential'),
    ('deteriorate', 'become progressively worse', '恶化', 'deteriorate', 'determine', 'deliberate', 'demonstrate'),
    ('efficient', 'working in a well-organized way', '高效的', 'efficient', 'effective', 'elegant', 'elaborate'),
    ('facilitate', 'make easier', '促进', 'facilitate', 'fabricate', 'fluctuate', 'fascinate'),
    ('inevitable', 'certain to happen', '不可避免的', 'inevitable', 'incredible', 'indifferent', 'inferior'),
    ('legitimate', 'reasonable and acceptable', '合法的；合理的', 'legitimate', 'literary', 'luxurious', 'loyal'),
    ('meticulous', 'very careful and precise', '一丝不苟的', 'meticulous', 'mysterious', 'magnificent', 'mature'),
    ('notorious', 'famous for something bad', '臭名昭著的', 'notorious', 'notable', 'numerous', 'neutral'),
    ('persistent', 'continuing firmly despite difficulty', '坚持不懈的', 'persistent', 'permanent', 'prominent', 'prevalent'),
    ('reluctant', 'unwilling', '不情愿的', 'reluctant', 'relevant', 'reliable', 'resistant'),
    ('simultaneous', 'happening at the same time', '同时的', 'simultaneous', 'spontaneous', 'symmetric', 'skeptical'),
    ('transparent', 'easy to see through; clear', '透明的；公开的', 'transparent', 'temporary', 'tremendous', 'tolerant'),
    ('vulnerable', 'easily harmed', '脆弱的', 'vulnerable', 'voluntary', 'vigorous', 'virtual'),
]
vocab += [    ('inherent', 'existing as a natural part', '固有的', 'inherent', 'intentional', 'instant', 'identical'),
    ('jeopardize', 'put at risk', '危及', 'jeopardize', 'jettison', 'justify', 'jog'),
    ('lucid', 'clear and easy to understand', '清晰易懂的', 'lucid', 'logical', 'latent', 'lateral'),
    ('mediate', 'help settle a dispute', '调解', 'mediate', 'memorize', 'modify', 'multiply'),
    ('novice', 'a person new to a field', '新手', 'novice', 'narrative', 'nominee', 'nuance'),
    ('obsolete', 'no longer in use', '过时的', 'obsolete', 'obvious', 'optional', 'optimal'),
    ('paradox', 'a seemingly contradictory statement', '悖论', 'paradox', 'preview', 'patent', 'pioneer'),
    ('quota', 'a limited share or number', '配额', 'quota', 'query', 'quarry', 'quote'),
    ('resilient', 'able to recover quickly', '有韧性的', 'resilient', 'redundant', 'radical', 'rational'),
    ('scrutinize', 'examine closely', '仔细审查', 'scrutinize', 'simulate', 'stipulate', 'sanction'),
    ('tentative', 'not certain or final', '试探性的', 'tentative', 'tedious', 'thorough', 'typical'),
    ('undermine', 'weaken gradually', '逐渐削弱', 'undermine', 'underline', 'undertake', 'unfold'),
    ('versatile', 'able to adapt to many functions', '多才多艺的', 'versatile', 'verbose', 'vicious', 'vivid'),
    ('withdraw', 'remove or take back', '撤回；取款', 'withdraw', 'witness', 'wander', 'warrant'),
    ('yield', 'produce or give way', '产生；让步', 'yield', 'yearn', 'yawn', 'yell'),
    ('zeal', 'great enthusiasm', '热情', 'zeal', 'zone', 'zero', 'zest'),
    ('alleviate', 'make less severe', '减轻', 'alleviate', 'allocate', 'alternate', 'assemble'),
    ('coherent', 'logical and consistent', '连贯的', 'coherent', 'coincident', 'collateral', 'colonial'),
    ('deficit', 'the amount by which something falls short', '赤字', 'deficit', 'default', 'delegate', 'delight'),
    ('elicit', 'draw out a response', '引出', 'elicit', 'eliminate', 'elaborate', 'elevate'),
    ('fluctuate', 'rise and fall irregularly', '波动', 'fluctuate', 'foresee', 'foster', 'frustrate'),
    ('gratitude', 'the quality of being thankful', '感激', 'gratitude', 'gravity', 'glimpse', 'garment'),
    ('hinder', 'create difficulties for', '阻碍', 'hinder', 'harbor', 'hoist', 'hurl'),
    ('imminent', 'about to happen', '即将发生的', 'imminent', 'immense', 'immune', 'implicit'),
    ('juxtapose', 'place side by side for contrast', '并置', 'juxtapose', 'jubilant', 'judicious', 'jargon'),
    ('lucrative', 'producing a great deal of profit', '利润丰厚的', 'lucrative', 'legible', 'lenient', 'lethal'),
    ('mandatory', 'required by law or rule', '强制性的', 'mandatory', 'magnanimous', 'manual', 'marginal'),
]
for i, (word, meaning, zh, a, b, c, d) in enumerate(vocab):
    opts = [meaning, f'{zh}（错误释义）', f'related to {b}', f'opposite of {d}']
    qs.append(mk(f'pg_en_v{i:03d}', '词汇', f'The word "{word}" most probably means ______.',
                 opts, 'A', f'{word} 意为「{zh}」，即 {meaning}。', ['词汇']))
# 反义词
antonyms = [
    ('optimistic', 'pessimistic', '乐观的'), ('expand', 'shrink', '扩张'), ('ancient', 'modern', '古老的'),
    ('abundant', 'scarce', '充足的'), ('accelerate', 'decelerate', '加速'), ('approve', 'reject', '批准'),
    ('artificial', 'natural', '人造的'), ('ascend', 'descend', '上升'), ('beneficial', 'harmful', '有益的'),
    ('brilliant', 'dull', '杰出的'), ('casual', 'formal', '随意的'), ('cautious', 'reckless', '谨慎的'),
    ('conceal', 'reveal', '隐藏'), ('constant', 'variable', '恒定的'), ('curious', 'indifferent', '好奇的'),
    ('decline', 'accept', '下降/拒绝'), ('dense', 'sparse', '密集的'), ('domestic', 'foreign', '国内的'),
    ('durable', 'fragile', '耐用的'), ('emerge', 'vanish', '出现'), ('fragile', 'sturdy', '脆弱的'),
    ('generous', 'stingy', '慷慨的'), ('hostile', 'friendly', '敌对的'), ('initial', 'final', '最初的'),
    ('intense', 'mild', '强烈的'), ('junior', 'senior', '初级的'), ('loyal', 'disloyal', '忠诚的'),
    ('major', 'minor', '主要的'), ('maximum', 'minimum', '最大值'), ('obscure', 'clear', '模糊的'),
    ('optimistic', 'pessimistic', '乐观的'), ('passive', 'active', '被动的'), ('permanent', 'temporary', '永久的'),
    ('positive', 'negative', '积极的'), ('prior', 'subsequent', '先前的'), ('profound', 'superficial', '深刻的'),
    ('rapid', 'slow', '快速的'), ('rigid', 'flexible', '僵硬的'), ('scarce', 'plentiful', '稀缺的'),
    ('severe', 'mild', '严重的'), ('stable', 'unstable', '稳定的'), ('subtle', 'obvious', '微妙的'),
    ('superior', 'inferior', '优越的'), ('tragic', 'comic', '悲剧的'), ('vague', 'precise', '模糊的'),
    ('valid', 'invalid', '有效的'),
]
for i, (w1, w2, zh) in enumerate(antonyms):
    if i >= 30: break
    qs.append(mk(f'pg_en_a{i:03d}', '词汇', f'The antonym of "{w1}" is ______.',
                 [w2, w1.upper(), f'un{w1}', f'{w1}ly'], 'A', f'{w1}（{zh}）的反义词是 {w2}。', ['反义词']))
# 语法：时态/虚拟/非谓语/连词/主谓一致
grammar = [
    ('By the time you arrive, I ______ the report.', ['will have finished', 'finish', 'finished', 'am finishing'], '将来完成时', 'by the time + 将来时间 → 将来完成时 will have done。'),
    ('She suggested that he ______ the meeting.', ['attend', 'attends', 'attended', 'will attend'], '虚拟语气', 'suggest 后接 that 从句用虚拟语气（should+动词原形）。'),
    ('If I ______ you, I would accept the offer.', ['were', 'was', 'am', 'be'], '虚拟语气', '与现在事实相反的条件句，be 动词用 were。'),
    ('He is used to ______ early in the morning.', ['getting up', 'get up', 'gets up', 'got up'], '非谓语', 'be used to doing sth. 习惯于做某事。'),
    ('______ the rain, the match was postponed.', ['Owing to', 'Because', 'In spite of', 'Despite of'], '介词短语', 'owing to = because of 由于；because 后接从句。'),
    ('Neither the students nor the teacher ______ aware of the change.', ['was', 'were', 'are', 'have been'], '主谓一致', 'neither...nor 就近原则，按最接近的 teacher 用单数。'),
    ('The novel ______ last year is now a bestseller.', ['published', 'publishing', 'to publish', 'publish'], '非谓语', 'novel 与 publish 是被动关系，用过去分词作后置定语。'),
    ('Not until midnight ______ working.', ['did he stop', 'he stopped', 'he did stop', 'stopped he'], '倒装', 'not until 置于句首时主句部分倒装。'),
    ('She speaks English ______ fluently ______ she writes.', ['as...as', 'so...that', 'such...that', 'more...than'], '比较结构', 'as...as 同级比较：说得和写得一样流利。'),
    ('Hardly ______ home when it began to rain.', ['had he got', 'he had got', 'did he get', 'he got'], '倒装', 'hardly...when 结构中 hardly 置于句首用部分倒装（过去完成时）。'),
    ('It is high time that we ______ action.', ['took', 'take', 'will take', 'takes'], '虚拟语气', 'It is (high) time that + 过去式 表示"该做某事了"。'),
    ('The committee ______ made up of ten members.', ['is', 'are', 'were', 'be'], '主谓一致', 'committee 作为整体视为单数。'),
    ('She insisted that the work ______ done before Friday.', ['be', 'is', 'was', 'being'], '虚拟语气', 'insist 后 that 从句用 (should) be done。'),
    ('______ more time, we could have finished the task.', ['Given', 'Giving', 'Give', 'To give'], '非谓语', 'given more time 过去分词短语表条件（如果给予更多时间）。'),
    ('The number of students in the class ______ thirty.', ['is', 'are', 'were', 'have been'], '主谓一致', 'the number of + 复数名词 谓语用单数。'),
    ('A number of students ______ going to the lecture.', ['are', 'is', 'was', 'has been'], '主谓一致', 'a number of + 复数名词 谓语用复数。'),
    ('The question ______ at the meeting remains unsolved.', ['discussed', 'discussing', 'to discuss', 'discuss'], '非谓语', '被讨论的问题：过去分词作定语。'),
    ('I would rather you ______ now.', ['left', 'leave', 'will leave', 'leaving'], '虚拟语气', 'would rather + 从句用过去式表虚拟。'),
    ('Scarcely ______ the door when the phone rang.', ['had he closed', 'he closed', 'he had closed', 'did he close'], '倒装', 'scarcely...when 结构部分倒装。'),
    ('The reason ______ he was late is that he missed the bus.', ['why', 'which', 'that', 'what'], '定语从句', 'reason 后接 why 引导的定语从句。'),
]
for i, (stem, opts, tag, ana) in enumerate(grammar):
    qs.append(mk(f'pg_en_g{i:03d}', '语法', stem, opts, 'A', ana, [tag]))

# ---------- 阅读 30 ----------
passages = [
    ('Reading is one of the most effective ways to improve vocabulary. Studies show that people who read regularly encounter more words in context, which helps them understand and remember meanings better.', 'According to the passage, regular reading helps improve vocabulary mainly because ______.', ['readers meet words in context', 'readers memorize dictionaries', 'reading is easy', 'reading is fast'], '读者在语境中接触词汇，更易理解和记忆。'),
    ('Global warming has caused sea levels to rise at an alarming rate. Coastal cities are now investing heavily in flood defenses to protect their residents.', 'Coastal cities invest in flood defenses because ______.', ['sea levels are rising', 'flood defenses are cheap', 'residents want tourism', 'sea levels are falling'], '全球变暖导致海平面上升，沿海城市因此投资防洪设施。'),
    ('Sleep plays a crucial role in memory consolidation. During deep sleep, the brain replays and strengthens the day\u2019s learning.', 'Memory consolidation mainly happens during ______.', ['deep sleep', 'morning exercise', 'breakfast', 'daytime work'], '深度睡眠期间大脑回放并强化白天的学习内容。'),
    ('The rapid development of artificial intelligence has transformed many industries. However, it also raises concerns about job displacement.', 'What is one concern raised by AI development?', ['job displacement', 'higher costs', 'slower progress', 'less data'], 'AI 的快速发展也引发了关于岗位流失的担忧。'),
    ('A healthy diet rich in vegetables and fruits can reduce the risk of chronic diseases. Experts recommend eating at least five portions of fruits and vegetables a day.', 'Experts recommend eating at least ______ portions of fruits and vegetables daily.', ['five', 'two', 'ten', 'one'], '专家建议每天至少吃五份水果蔬菜。'),
    ('The invention of the printing press made books widely available, greatly accelerating the spread of knowledge and ideas across Europe.', 'The printing press accelerated the spread of ______.', ['knowledge and ideas', 'diseases', 'wars', 'coins'], '印刷术加速了知识与思想的传播。'),
    ('Online learning offers flexibility that traditional classrooms cannot match, allowing students to study at their own pace from anywhere.', 'What advantage of online learning is mentioned?', ['flexibility', 'lower quality', 'less interaction', 'higher cost'], '线上学习的优势是灵活性。'),
    ('Renewable energy sources such as solar and wind power are becoming more cost-effective, making them a viable alternative to fossil fuels.', 'Solar and wind power are becoming ______.', ['more cost-effective', 'more expensive', 'less available', 'outdated'], '太阳能和风能正变得越来越经济。'),
    ('Regular physical exercise is associated with better mental health. Even moderate activity like walking can reduce symptoms of anxiety and depression.', 'Moderate activity such as walking can help reduce ______.', ['anxiety and depression', 'physical strength', 'sleep quality', 'appetite'], '适度的运动如散步有助于缓解焦虑和抑郁。'),
    ('The rise of e-commerce has changed shopping habits worldwide. Consumers now expect fast delivery and easy returns.', 'E-commerce has changed consumers\u2019 expectations about ______.', ['delivery and returns', 'store size', 'parking', 'advertising'], '电商改变了消费者对配送和退换货的期望。'),
    ('Biodiversity is essential for ecosystem stability. The loss of any species can disrupt the delicate balance of nature.', 'The loss of a species can ______ ecosystem balance.', ['disrupt', 'improve', 'maintain', 'strengthen'], '物种的消失会破坏生态系统的平衡。'),
    ('Time management is a key skill for academic success. Students who plan their schedules are more likely to meet deadlines and reduce stress.', 'Planning schedules helps students ______.', ['meet deadlines and reduce stress', 'avoid studying', 'sleep more', 'skip classes'], '规划时间表有助于学生按时完成并减轻压力。'),
    ('Urban gardens are gaining popularity as a way to grow fresh food in cities and improve community well-being.', 'Urban gardens are popular partly because they ______.', ['grow fresh food in cities', 'increase pollution', 'raise food prices', 'limit community'], '城市花园因能在城市里种植新鲜食物而受欢迎。'),
    ('Scientific curiosity has driven many of history\u2019s greatest discoveries. Asking "why" leads to innovations that improve daily life.', 'According to the passage, asking "why" leads to ______.', ['innovations', 'mistakes', 'confusion', 'delays'], '探究"为什么"推动了改善日常生活的创新。'),
    ('Public libraries provide free access to knowledge for all citizens, playing a vital role in education and social equality.', 'Public libraries are important for ______.', ['education and social equality', 'tourism', 'business profits', 'entertainment only'], '公共图书馆在教育和促进社会平等方面发挥重要作用。'),
]
for i in range(30):
    p = passages[i % len(passages)]
    stem_text, q_text, opts, ana = p
    if i >= len(passages):
        # 变化措辞生成更多
        stem_text = stem_text.replace('The', 'One')
        q_text = q_text.replace('According to the passage', 'Based on the passage')
    qs.append(mk(f'pg_en_r{i:03d}', '阅读', f'Passage: {stem_text}\nQuestion: {q_text}',
                 opts[:4], 'A', ana, ['阅读']))

print('english questions:', len(qs))
import collections
print(collections.Counter(q['tags'][0] for q in qs))
io.open(os.path.join(OUT, 'qbankEnglishGen.json'), 'w', encoding='utf-8').write(json.dumps(qs, ensure_ascii=False))
# 生成 JS
body = '// qbankEnglishGen.js —— 英语一模拟练习（词汇/语法/阅读，自动生成，勿手改）\nexport const PRACTICE_EN_ALL = [\n'
for q in qs:
    opts = ', '.join(json.dumps(o, ensure_ascii=False) for o in q['options'])
    tags = ', '.join(json.dumps(t, ensure_ascii=False) for t in q['tags'])
    body += ('  { id: %s,\n    year: 2026,\n    subject: \'英语一\',\n    type: \'choice\',\n    no: 0,\n'
             '    stem: %s,\n    options: [%s],\n    answer: %s,\n    analysis: %s,\n    tags: [%s],\n    source: \'practice\' },\n') % (
        json.dumps(q['id'], ensure_ascii=False), json.dumps(q['stem'], ensure_ascii=False),
        opts, json.dumps(q['answer']), json.dumps(q['analysis'], ensure_ascii=False), tags)
body += ']\n'
io.open(os.path.join(OUT, 'qbankEnglishGen.js'), 'w', encoding='utf-8').write(body)
io.open(os.path.join(OUT, 'qbankEnglish.js'), 'w', encoding='utf-8').write(
    '// qbankEnglish.js —— 英语一模拟练习汇总入口\nimport { PRACTICE_EN_ALL } from \'./qbankEnglishGen.js\'\nexport const ENGLISH = [...PRACTICE_EN_ALL]\n')
print('done')