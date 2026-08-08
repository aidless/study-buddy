import urllib.request, json, os
base = os.environ['SB_URL']
key = os.environ['SB_SERVICE_ROLE']
def req(method, url, data=None, headers=None, raw=None):
    h = {'Authorization': 'Bearer ' + key}
    if headers: h.update(headers)
    r = urllib.request.Request(url, data=raw if raw is not None else data, method=method, headers=h)
    try:
        resp = urllib.request.urlopen(r, timeout=60)
        return resp.status, resp.read().decode('utf-8', 'ignore')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'ignore')
# 查看对象信息
st, body = req('GET', base + '/storage/v1/object/info/public/study-buddy/index.html')
print('info:', st, body[:200])
# 重新上传 index.html，显式 text/html
raw = open(os.path.join(os.environ['SB_DIST'], 'index.html'), 'rb').read()
st, body = req('POST', base + '/storage/v1/object/study-buddy/index.html', None, {'Content-Type': 'text/html; charset=utf-8', 'x-upsert': 'true'}, raw)
print('reupload:', st, body[:100])
st, body = req('GET', base + '/storage/v1/object/info/public/study-buddy/index.html')
print('info after:', st, body[:200])