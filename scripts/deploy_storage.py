import urllib.request, json, os
base = os.environ['SB_URL']
key = os.environ['SB_SERVICE_ROLE']
dist = os.environ['SB_DIST']
BUCKET = 'study-buddy'
def req(method, url, data=None, headers=None, raw=None):
    h = {'Authorization': 'Bearer ' + key}
    if headers: h.update(headers)
    r = urllib.request.Request(url, data=raw if raw is not None else data, method=method, headers=h)
    try:
        resp = urllib.request.urlopen(r, timeout=90)
        return resp.status, resp.read().decode('utf-8', 'ignore')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'ignore')
st, body = req('POST', base + '/storage/v1/bucket', json.dumps({'id': BUCKET, 'name': BUCKET, 'public': True}).encode('utf-8'), {'Content-Type': 'application/json'})
print('create bucket:', st, body[:100])
if st >= 400 and 'already exists' not in body.lower():
    st2, b2 = req('PUT', base + '/storage/v1/bucket/' + BUCKET, json.dumps({'public': True}).encode('utf-8'), {'Content-Type': 'application/json'})
    print('update bucket:', st2, b2[:100])
types = {'.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
         '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json'}
count = 0
for root, _, files in os.walk(dist):
    for fn in files:
        fp = os.path.join(root, fn)
        rel = os.path.relpath(fp, dist).replace('\\', '/')
        ct = types.get(os.path.splitext(fn)[1].lower(), 'application/octet-stream')
        raw = open(fp, 'rb').read()
        st, body = req('POST', base + '/storage/v1/object/study-buddy/' + rel, None, {'Content-Type': ct, 'x-upsert': 'true'}, raw)
        if st >= 400:
            print('FAIL', rel, st, body[:100])
        else:
            count += 1
print('uploaded', count, 'files')