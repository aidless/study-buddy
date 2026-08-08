import json, io, os, glob, re, subprocess

BASE = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default'
GROUPS = ['科研', '论文', 'agent', 'app']
TARGET = r'F:\test\2026-07-31-21-50-31\study-buddy'
PROJ_HINTS = ('study-buddy', '2026-07-31-21-50-31')

ops = []

def is_proj_path(p):
    p2 = p.replace('\\', '/')
    return any(h in p2 for h in PROJ_HINTS)

def collect():
    for g in GROUPS:
        d = os.path.join(BASE, g, 'haolo-ai-home', 'sessions')
        if not os.path.isdir(d): continue
        for p in glob.glob(os.path.join(d, '**', '*.jsonl'), recursive=True):
            try:
                with io.open(p, encoding='utf-8', errors='replace') as f:
                    for line in f:
                        try: obj = json.loads(line)
                        except Exception: continue
                        ts = obj.get('timestamp') or ''
                        pl = obj.get('payload') or {}
                        t = pl.get('type')
                        if t == 'function_call':
                            try: args = json.loads(pl.get('arguments') or '{}')
                            except Exception: args = {}
                            name = pl.get('name') or ''
                            if name == 'apply_patch':
                                patch = args.get('patch') or ''
                                if patch and is_proj_path(patch): ops.append((ts, 'patch', patch))
                            elif name in ('shell_command', 'exec'):
                                cmd = args.get('command') or ''
                                if cmd and ('study-buddy' in cmd or '2026-07-31-21-50-31' in cmd):
                                    ops.append((ts, 'cmd', cmd))
                        elif t == 'custom_tool_call':
                            name = pl.get('name') or ''
                            inp = pl.get('input') or ''
                            if name == 'apply_patch' and inp and is_proj_path(inp):
                                ops.append((ts, 'patch', inp))
                            elif name in ('shell_command', 'exec', 'functions.exec') and inp and ('study-buddy' in inp or '2026-07-31-21-50-31' in inp):
                                ops.append((ts, 'cmd', inp))
            except Exception as e:
                print('skip', p, e)

collect()
ops.sort(key=lambda x: x[0])
print('total ops:', len(ops), 'patches:', sum(1 for _, k, _ in ops if k == 'patch'), 'cmds:', sum(1 for _, k, _ in ops if k == 'cmd'))

def rel_of(path):
    p2 = path.replace('\\', '/')
    for h in PROJ_HINTS:
        if h in p2:
            p2 = p2.split(h, 1)[1].lstrip('/')
            break
    return p2

def apply_patch_block(patch):
    body = patch.strip()
    if not body.startswith('*** Begin Patch'): return ('bad', 'no begin')
    body = body[len('*** Begin Patch'):].rstrip()
    if body.endswith('*** End Patch'):
        body = body[:-len('*** End Patch')].rstrip()
    parts = re.split(r'(?=^\*\*\* (?:Add File|Update File|Delete File):)', body, flags=re.M)
    diff = ''
    for part in parts:
        part = part.strip('\n')
        m = re.match(r'\*\*\* (Add File|Update File|Delete File): (.+)', part)
        if not m: continue
        kind, path = m.groups()
        path = path.strip().replace('\\', '/')
        if not is_proj_path(path): continue
        rel = rel_of(path)
        if kind == 'Delete File':
            diff += f'diff --git a/{rel} b/{rel}\ndeleted file mode 100644\n--- a/{rel}\n+++ /dev/null\n@@ -1,0 +0,0 @@\n'
            continue
        content = part.split('\n', 1)[1] if '\n' in part else ''
        if kind == 'Add File':
            lines = []
            for ln in content.split('\n'):
                if ln.startswith('+'): lines.append(ln[1:])
                else: lines.append(ln)
            text = '\n'.join(lines)
            if not text.endswith('\n'): text += '\n'
            full = os.path.join(TARGET, rel)
            d = os.path.dirname(full)
            if d and not os.path.isdir(d): os.makedirs(d, exist_ok=True)
            with io.open(full, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
        else:
            diff += f'diff --git a/{rel} b/{rel}\n--- a/{rel}\n+++ b/{rel}\n' + content + '\n'
    if diff.strip():
        df = os.path.join(TARGET, '.recover.patch')
        with io.open(df, 'w', encoding='utf-8', newline='') as f:
            f.write(diff)
        r = subprocess.run(['git', 'apply', '--whitespace=nowarn', '--unsafe-paths', df], cwd=TARGET, capture_output=True, text=True)
        if r.returncode != 0:
            return ('fail', r.stderr[:250])
    return ('ok', '')

def parse_cmd_write(cmd):
    m = re.search(r"WriteAllText\(\s*'([^']+)'\s*,\s*(.+?)\s*,\s*\[System\.Text\.UTF8Encoding\]::new\(\$false\)\s*\)", cmd, re.S)
    if m:
        path, content = m.group(1), m.group(2)
        if content.startswith("@'") and content.endswith("'@"):
            content = content[2:-2]
        elif content.startswith("'") and content.endswith("'"):
            content = content[1:-1].replace("''", "'")
        elif content.startswith('"') and content.endswith('"'):
            content = content[1:-1].replace('\\"', '"')
        return path, content
    m = re.search(r"@'([\s\S]*?)'@\s*\|\s*(?:Set-Content|Out-File)(?:\s+-Path)?\s+[\"']?([^\"'\r\n]+)", cmd)
    if m:
        return m.group(2).strip(), m.group(1)
    m = re.search(r"Set-Content\s+-Path\s+['\"]([^'\"]+)['\"]\s+-Value\s+@'([\s\S]*?)'@", cmd)
    if m:
        return m.group(1), m.group(2)
    return None, None

# clean previous partial junk (keep node_modules + logs)
for item in os.listdir(TARGET):
    full = os.path.join(TARGET, item)
    if item in ('node_modules', 'preview-run.log', 'preview-run.log.err', '.git'):
        continue
    if os.path.isdir(full):
        shutil.rmtree(full, ignore_errors=True)
    else:
        os.remove(full)
if not os.path.isdir(os.path.join(TARGET, '.git')):
    subprocess.run(['git', 'init', '-q'], cwd=TARGET, capture_output=True)

n_ok = n_fail = n_write = 0
fails = []
for ts, kind, payload in ops:
    if kind == 'patch':
        status, msg = apply_patch_block(payload)
        if status == 'ok': n_ok += 1
        else:
            n_fail += 1
            if len(fails) < 30: fails.append((ts[:19], msg))
    else:
        path, content = parse_cmd_write(payload)
        if not path: continue
        if not is_proj_path(path): continue
        rel = rel_of(path)
        if not rel: continue
        full = os.path.join(TARGET, rel)
        d = os.path.dirname(full)
        if d and not os.path.isdir(d): os.makedirs(d, exist_ok=True)
        try:
            with io.open(full, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            n_write += 1
        except Exception as e:
            print('write fail', rel, e)

print(f'patches ok: {n_ok}, fail: {n_fail}, direct writes: {n_write}')
if fails:
    print('patch failures sample:')
    for t, m in fails: print('  ', t, m)
files = []
for root, _, fs in os.walk(TARGET):
    if '.git' in root or 'node_modules' in root: continue
    for fn in fs: files.append(os.path.relpath(os.path.join(root, fn), TARGET))
print('reconstructed files:', len(files))
for f in sorted(files)[:60]: print('  ', f)