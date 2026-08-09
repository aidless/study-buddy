import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
names = z.namelist()
assert "index.html" in names, "index.html missing at zip root"
print("zip ok:", len(names), "entries")
