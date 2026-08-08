# -*- coding: utf-8 -*-
import io
p = r'F:\Roaming\haolo_desktop\thread-groups\default\app\outputs\study-buddy\docs\部署指南.md'
s = io.open(p, encoding='utf-8').read()
s = s.replace('- [ ] 静态站托管（见下）', '- [x] 静态站托管：https://study-buddy.surge.sh （Surge）')
old = '## 方案 B（推荐现在用）：Vercel / Netlify（静态站；AI 名师函数已上线，无需再部署）'
new = """## 方案 C（已采用）：Surge.sh（已上线）
- 线上地址：https://study-buddy.surge.sh （账号 17353895263@163.com）
- 更新流程：改代码后构建，再运行：surge dist study-buddy.surge.sh
- 发布构建命令（相对路径 + 线上 AI 地址）：
  set VITE_AI_TUTOR_URL=https://cfxsyvbxnmvmspklebfa.functions.supabase.co/ai-tutor
  npm run build -- --base=./
"""
if old in s:
    s = s.replace(old, new)
else:
    s += '\n' + new
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('guide updated, contains surge:', 'study-buddy.surge.sh' in s)