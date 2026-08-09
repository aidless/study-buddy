import zipfile, os, sys
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(src):
        for fn in files:
            fp = os.path.join(root, fn)
            rel = os.path.relpath(fp, src).replace(os.sep, "/")
            z.write(fp, rel)
print("zip ok")
