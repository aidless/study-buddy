# -*- coding: utf-8 -*-
"""生成英语一作文模拟题（小作文 8 + 大作文 8，带参考范文与评分要点）"""
import io, os, json

OUT = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\src\lib'

# 小作文：书信/通知类
small = [
 ('写一封申请信，申请加入某大学计算机科学专业的研究生项目。', 
  'Dear Sir or Madam, I am writing to apply for the Master of Computer Science program at your university. I am a senior student majoring in Computer Science, and I have developed a strong interest in machine learning through my coursework and research projects. I believe your program, with its excellent faculty and resources, will help me achieve my academic goals. I would be grateful if you could consider my application. I look forward to your reply. Yours sincerely, Li Ming'),
 ('你刚收到朋友送的一本书，写一封感谢信。',
  'Dear Tom, I am writing to express my sincere gratitude for the book you sent me. It is exactly what I have been looking for, and I have already benefited a great deal from reading it. Your kindness means a lot to me. I will treasure this gift and the friendship behind it. I hope to see you soon and thank you in person. Yours sincerely, Li Ming'),
 ('写一封建议信，给一位即将开始大学生活的朋友提建议。',
  'Dear Jack, I am delighted to hear that you are about to begin your college life. Here are a few suggestions. First, try to manage your time well, as self-discipline matters most in college. Second, do not be afraid to ask teachers and classmates for help. Finally, make time for exercise and rest to stay healthy. I believe you will enjoy a fruitful college life. Best wishes, Li Ming'),
 ('写一封投诉信，投诉网购商品质量问题。',
  'Dear Sir or Madam, I am writing to complain about the quality of the product I purchased from your online store last week. When it arrived, I found that it was damaged and did not work properly, which is far from what was described on your website. I would appreciate it if you could replace the product or refund my money as soon as possible. Thank you for your attention. Yours faithfully, Li Ming'),
 ('写一封邀请信，邀请外国朋友参加你校的文化节。',
  'Dear Susan, I am writing to invite you to attend the Culture Festival to be held in our school on June 15. There will be various activities, including traditional performances, food tasting and calligraphy shows. It will be a wonderful chance for you to learn more about Chinese culture. I sincerely hope you can come. Please let me know if you are available. Yours sincerely, Li Ming'),
 ('写一封道歉信，为自己未能按时归还借书道歉。',
  'Dear Professor Wang, I am writing to apologize for not returning the book I borrowed from you on time. I had planned to finish reading it earlier, but an unexpected deadline kept me busy. I fully understand the inconvenience this may have caused you. Please accept my sincere apologies. I will return the book tomorrow. Yours sincerely, Li Ming'),
 ('写一封询问信，向图书馆咨询借阅规则。',
  'Dear Sir or Madam, I am writing to inquire about the borrowing rules of the library. I would like to know how many books a student can borrow at a time, and how long each book can be kept. I would also appreciate it if you could tell me the process of reserving a book online. Thank you for your time. Yours sincerely, Li Ming'),
 ('写一份通知，告知同学们运动会的时间与安排。',
  'NOTICE Dear students, the annual school sports meeting will be held on October 10 on the playground. All students are required to attend the opening ceremony at 8:00 a.m. Participants should register with their class monitors by September 30. Please arrive on time and follow the arrangements. The Students Union'),
]
big = [
 ('坚持：图画中一个人在日复一日地攀登同一座山峰。', 
  'As is vividly depicted in the picture, a man keeps climbing the same mountain day after day, regardless of wind and rain. The picture conveys a profound message: persistence is the key to success. In our studies, we often face difficulties and setbacks. Those who persist, however small their steps, will eventually reach the summit, while those who give up halfway will achieve nothing. From my perspective, we should cultivate perseverance in everything we do, break a big goal into small steps, and never lose heart in the face of failure. Only in this way can we fulfill our dreams.'),
 ('环保：图画中一棵树被人为砍伐，旁边有新的幼苗。',
  'The picture shows a tree being cut down while a young sapling is planted beside it. It reminds us of the urgent need to protect our environment. Deforestation leads to soil erosion, climate change and the loss of wildlife. To build a sustainable future, we should reduce the use of disposable products, plant more trees, and raise public awareness of environmental protection. Each of us can make a difference. Let us act now, for the sake of our planet and the generations to come.'),
 ('诚信：图画中一位商贩的秤是准的，生意兴隆。',
  'In the picture, a small vendor uses an honest scale and his business is thriving. The message is clear: honesty is the best policy. In business and in life, people who are trustworthy win long-term respect and cooperation, while those who cheat may profit temporarily but lose everything in the end. As students, we should be honest in exams, in dealing with others, and in evaluating ourselves. Integrity is not only a virtue but also a foundation for a stable society.'),
 ('合作：图画中两只手紧紧握在一起，共同托起一个球。',
  'The picture vividly shows two hands holding a ball together. It illustrates the importance of cooperation. In the era of globalization, no individual can succeed alone. Teamwork enables us to combine different strengths, share ideas and solve problems more efficiently. At school, we can practice cooperation in group projects; at work, we should respect different opinions and contribute our own share. Only by working hand in hand can we achieve greater goals.'),
 ('创新：图画中一个人在无数旧灯泡中点亮了一盏新灯。',
  'As is shown in the picture, among many old light bulbs, a person lights a brand-new one. The picture symbolizes the value of innovation. History has proved that progress comes from breaking conventions and daring to try new ideas. For students, innovation means questioning existing knowledge and exploring better ways of learning. We should encourage creativity in education, reward original thinking, and never be afraid of making mistakes in the process of creation. Innovation is the engine of human progress.'),
 ('奋斗：图画中一位青年在图书馆通宵学习。',
  'The picture shows a young man studying in the library late into the night. It reminds us that hard work is the shortcut to success. There is no free lunch in the world; every achievement is the result of painstaking effort. As students facing fierce competition, we should make full use of our time, set clear goals and work persistently toward them. Diligence today will bring harvest tomorrow. Let us embrace hard work and never regret the effort we make in our youth.'),
 ('心态：图画中两个杯子，一个被画成半满，一个被画成半空。',
  'As is vividly shown in the picture, one cup is drawn half full while the other is half empty. The contrast illustrates the power of a positive attitude. Faced with the same situation, optimists see opportunities while pessimists see difficulties. A positive mindset helps us stay calm under pressure, recover quickly from setbacks, and keep moving forward. In our daily life, we should learn to appreciate what we have and view challenges as chances to grow. Attitude determines altitude.'),
 ('科技：图画中人们低头看手机，忽略了身边的美景。',
  'The picture shows a group of people staring at their phones, completely ignoring the beautiful scenery around them. It reflects a common phenomenon in modern society: we are so absorbed in the virtual world that we forget to enjoy real life. While technology brings convenience, over-reliance on it may weaken our communication and alienate us from nature and family. We should use technology wisely, set limits on screen time, and spend more time with the people we love. Balance is the key.'),
]

def mk_writing(i, kind, prompt, answer):
    return {'id': f'pg_enw_{i:03d}', 'year': 2026, 'subject': '英语一', 'type': 'essay', 'no': 0,
            'stem': prompt, 'parts': [{'no': '', 'prompt': '', 'answer': answer}],
            'analysis': '参考范文见答案。写作要点：结构清晰（开头-正文-结尾）、衔接词使用、语法正确、卷面整洁。',
            'tags': ['英语作文', kind], 'source': 'practice'}

qs = []
for i, (p_, a) in enumerate(small):
    qs.append(mk_writing(i, '小作文', p_, a))
for i, (p_, a) in enumerate(big):
    qs.append(mk_writing(8 + i, '大作文', p_, a))
print('writing questions:', len(qs))

# 生成 JS
body = '// qbankEnglishWriting.js —— 英语一作文模拟题（小作文 8 + 大作文 8，带参考范文，自动生成勿手改）\nexport const ENGLISH_WRITING = [\n'
for q in qs:
    parts = ', '.join('{ no: %s, prompt: %s, answer: %s }' % (json.dumps(p['no'], ensure_ascii=False), json.dumps(p['prompt'], ensure_ascii=False), json.dumps(p['answer'], ensure_ascii=False)) for p in q['parts'])
    tags = ', '.join(json.dumps(t, ensure_ascii=False) for t in q['tags'])
    body += ('  { id: %s,\n    year: 2026,\n    subject: \'英语一\',\n    type: \'essay\',\n    no: 0,\n'
             '    stem: %s,\n    parts: [%s],\n    analysis: %s,\n    tags: [%s],\n    source: \'practice\' },\n') % (
        json.dumps(q['id'], ensure_ascii=False), json.dumps(q['stem'], ensure_ascii=False), parts,
        json.dumps(q['analysis'], ensure_ascii=False), tags)
body += ']\n'
io.open(os.path.join(OUT, 'qbankEnglishWriting.js'), 'w', encoding='utf-8').write(body)
# 更新 qbankEnglish.js
io.open(os.path.join(OUT, 'qbankEnglish.js'), 'w', encoding='utf-8').write(
    '// qbankEnglish.js —— 英语一模拟练习汇总入口\nimport { PRACTICE_EN_ALL } from \'./qbankEnglishGen.js\'\nimport { ENGLISH_WRITING } from \'./qbankEnglishWriting.js\'\nexport const ENGLISH = [...PRACTICE_EN_ALL]\nexport const ENGLISH_WRITING = [...ENGLISH_WRITING]\n')
print('qbankEnglish.js updated')