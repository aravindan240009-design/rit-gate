import urllib.request, json, ssl
ctx = ssl._create_unverified_context()
url = "https://ritgate-backend.onrender.com/api/departments"
with urllib.request.urlopen(url, context=ctx) as r:
    d = json.loads(r.read())
depts = d if isinstance(d, list) else d.get('departments', d.get('data', []))
print(f"Total departments: {len(depts)}")
for dept in depts:
    hsc = dept.get('hodStaffCode', '')
    name = dept.get('name', '')
    hod = dept.get('hod', '')
    print(f"hodStaffCode={hsc!r:10} dept={name!r:20} hod={hod!r}")
