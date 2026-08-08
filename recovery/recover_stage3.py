import json, io, os, glob, re, subprocess, shutil

BASE = r'C:\Users\Administrator\AppData\Roaming\haolo_desktop\thread-groups\default'
GROUPS = ['科研', '论文', 'agent', 'app']
TARGET = r'F:\test\2026-07-31-21-50-31\study-buddy'
TP = TARGET.replace('\\', '/')
PROJ_HINTS = ('study-buddy', '2026-07-31-21-50-31')

calls = {}
outs = {}

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
                        cid = pl.get('call_id') or pl.get('id') or ''
                        if t == 'function_call':
                            try: args = json.loads(pl.get('arguments') or '{}')
                            except Exception: args = {}
                            name = pl.get('name') or ''
                            wd = (args.get('workdir') or '')
                            if name == 'apply_patch':
                                patch = args.get('patch') or ''
                                if patch: calls[cid] = (ts, 'patch', patch, '')
                            elif name in ('shell_command', 'exec'):
                                cmd = args.get('command') or ''
                                if cmd: calls[cid] = (ts, 'cmd', cmd, wd)
                        elif t == 'function_call_output':
                            outs[cid] = pl.get('output') or ''
                        elif t == 'custom_tool_call':
                            name = pl.get('name') or ''
                            inp = pl.get('input') or ''
                            wd = ''
                            if name == 'apply_patch' and inp:
                                calls[cid] = (ts, 'patch', inp, wd)
                            elif name in ('shell_command', 'exec', 'functions.exec') and inp:
                                calls[cid] = (ts, 'cmd', inp, wd)
            except Exception:
                pass

collect()
ops = []
for cid, (ts, kind, payload, wd) in calls.items():
    ops.append((ts, kind, payload, wd, outs.get(cid, '')))
ops.sort(key=lambda x: x[0])
print('ops:', len(ops), 'patches:', sum(1 for _, k, _, _, _ in ops if k == 'patch'), 'cmds:', sum(1 for _, k, _, _, _ in ops if k == 'cmd'))

def norm_rel(path):
    p2 = path.replace('\\', '/')
    for h in PROJ_HINTS:
        if h in p2:
            return p2.split(h, 1)[1].lstrip('/')
    return None

def resolve(p, wd):
    p2 = p.replace('\\', '/').strip('"').strip("'")
    if TP in p2:
        return norm_rel(p2)
    if wd:
        w2 = wd.replace('\\', '/')
        if TP in w2:
            base = w2.split('study-buddy', 1)[0] + 'study-buddy'
            if p2.startswith('.'):
                full = os.path.normpath(os.path.join(base, p2)).replace('\\', '/')
                if TP in full:
                    return norm_rel(full)
    # project hint in path but odd form
    for h in PROJ_HINTS:
        if h in p2:
            return p2.split(h, 1)[1].lstrip('/')
    return None

def codex_hunks_to_diff(content):
    lines = content.split('\n')
    out = []
    old = new = 1
    i = 0
    while i < len(lines):
        ln = lines[i]
        if ln.strip() == '@@':
            o_start, n_start = old, new
            body = []
            oc = nc = 0
            i += 1
            while i < len(lines) and lines[i].strip() != '@@':
                l2 = lines[i]
                if l2.startswith('-'):
                    body.append(l2); oc += 1; old += 1
                elif l2.startswith('+'):
                    body.append(l2); nc += 1; new += 1
                else:
                    body.append(' ' + l2); oc += 1; nc += 1; old += 1; new += 1
                i += 1
            out.append(f'@@ -{o_start},{oc} +{n_start},{nc} @@')
            out.extend(body)
        else:
            i += 1
    return '\n'.join(out) + ('\n' if out else '')

def apply_patch_block(patch):
    body = patch.strip()
    if not body.startswith('*** Begin Patch'): return ('bad', 'no begin')
    body = body[len('*** Begin Patch'):].rstrip()
    if body.endswith('*** End Patch'):
        body = body[:-len('*** End Patch')].rstrip()
    parts = re.split(r'(?=^\*\*\* (?:Add File|Update File|Delete File):)', body, flags=re.M)
    diff_parts = []
    for part in parts:
        part = part.strip('\n')
        m = re.match(r'\*\*\* (Add File|Update File|Delete File): (.+)', part)
        if not m: continue
        kind, path = m.groups()
        rel = norm_rel(path)
        if not rel: continue
        content = part.split('\n', 1)[1] if '\n' in part else ''
        if kind == 'Delete File':
            full = os.path.join(TARGET, rel)
            if os.path.exists(full): os.remove(full)
            continue
        if kind == 'Add File':
            lines = [ln[1:] if ln.startswith('+') else ln for ln in content.split('\n')]
            text = '\n'.join(lines)
            if not text.endswith('\n'): text += '\n'
            full = os.path.join(TARGET, rel)
            d = os.path.dirname(full)
            if d and not os.path.isdir(d): os.makedirs(d, exist_ok=True)
            with io.open(full, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
            continue
        hunk_diff = codex_hunks_to_diff(content)
        if not hunk_diff.strip(): continue
        diff_parts.append(f'diff --git a/{rel} b/{rel}\n--- a/{rel}\n+++ b/{rel}\n' + hunk_diff)
    if diff_parts:
        df = os.path.join(TARGET, '.recover.patch')
        with io.open(df, 'w', encoding='utf-8', newline='') as f:
            f.write('\n'.join(diff_parts))
        r = subprocess.run(['git', 'apply', '--whitespace=nowarn', '--unsafe-paths', df], cwd=TARGET, capture_output=True, text=True)
        if r.returncode != 0:
            return ('fail', r.stderr[:200])
    return ('ok', '')

def parse_cmd_write(cmd):
    var_here = {}
    for m in re.finditer(r"\$(\w+)\s*=\s*@'([\s\S]*?)'@", cmd):
        var_here[m.group(1)] = m.group(2)
    m = re.search(r"WriteAllText\(\s*'([^']+)'\s*,\s*\$(\w+)\s*,\s*\[System\.Text\.UTF8Encoding\]::new\(\$false\)\s*\)", cmd)
    if m and m.group(2) in var_here:
        return m.group(1), var_here[m.group(2)]
    m = re.search(r"WriteAllText\(\s*'([^']+)'\s*,\s*(.+?)\s*,\s*\[System\.Text\.UTF8Encoding\]::new\(\$false\)\s*\)", cmd, re.S)
    if m:
        path, content = m.group(1), m.group(2)
        if content.startswith("@'") and content.endswith("'@"):
            content = content[2:-2]
        elif content.startswith("'") and content.endswith("'"):
            content = content[1:-1].replace("''", "'")
        return path, content
    m = re.search(r"@'([\s\S]*?)'@\s*\|\s*(?:Set-Content|Out-File)(?:\s+-Path)?\s+[\"']?([^\"'\r\n]+)", cmd)
    if m:
        return m.group(2).strip(), m.group(1)
    return None, None

def getcontent_target(cmd):
    m = re.search(r"Get-Content(?:\s+-Raw)?\s+'([^']+)'", cmd)
    if m: return m.group(1)
    m = re.search(r"Get-Content(?:\s+-Raw)?\s+(\S+)", cmd)
    if m and 'Get-Content' not in m.group(1): return m.group(1)
    return None

def strip_output(out):
    o = out.strip()
    if o.startswith('Exit code:'):
        idx = o.find('\nOutput:\n')
        if idx >= 0:
            return o[idx + len('\nOutput:\n'):]
    return o

def looks_like_dump(body):
    if not body or len(body) < 200: return False
    first = body.lstrip('\n')[:40]
    if first.startswith(('Mode', 'Name', 'Directory:', 'Total lines', '---', 'Get-', 'PASS', 'FAIL', 'error:', 'PS ')):
        return False
    if 'Wall time:' in body[:60]: return False
    return True

# reset target
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

n_ok = n_fail = n_write = n_snap = 0
fails = []
snaps = []
for ts, kind, payload, wd, out in ops:
    if kind == 'patch':
        status, msg = apply_patch_block(payload)
        if status == 'ok': n_ok += 1
        else:
            n_fail += 1
            if len(fails) < 20: fails.append((ts[:19], msg))
        continue
    # cmd: direct write?
    path, content = parse_cmd_write(payload)
    if path:
        rel = resolve(path, wd)
        if rel:
            full = os.path.join(TARGET, rel)
            d = os.path.dirname(full)
            if d and not os.path.isdir(d): os.makedirs(d, exist_ok=True)
            with io.open(full, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            n_write += 1
            continue
    # cmd: Get-Content snapshot?
    gc = getcontent_target(payload)
    if gc and out:
        rel = resolve(gc, wd)
        if rel:
            body = strip_output(out)
            if looks_like_dump(body):
                snaps.append((ts, rel, body))
                full = os.path.join(TARGET, rel)
                d = os.path.dirname(full)
                if d and not os.path.isdir(d): os.makedirs(d, exist_ok=True)
                with io.open(full, 'w', encoding='utf-8', newline='') as f:
                    f.write(body)
                n_snap += 1

print(f'patches ok: {n_ok}, fail: {n_fail}, writes: {n_write}, snapshots: {n_snap}')
if fails:
    print('sample failures:')
    for t, m in fails[:20]: print('  ', t, m)
files = []
for root, _, fs in os.walk(TARGET):
    if '.git' in root or 'node_modules' in root: continue
    for fn in fs: files.append(os.path.relpath(os.path.join(root, fn), TARGET))
print('reconstructed files:', len(files))
for f in sorted(files): print('  ', f)