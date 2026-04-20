import urllib.request, json, ssl
ctx = ssl._create_unverified_context()

# Check the debug endpoint to see what departments are found
url = "https://ritgate-backend.onrender.com/api/hod/CS56/department/students"
with urllib.request.urlopen(url, context=ctx) as r:
    d = json.loads(r.read())

depts = set(s.get('department') for s in d.get('students', []))
print(f"Students count: {d.get('count')}")
print(f"Departments: {depts}")

# Also check the HOD profile to see what id field returns
url2 = "https://ritgate-backend.onrender.com/api/hod/CS56"
with urllib.request.urlopen(url2, context=ctx) as r:
    d2 = json.loads(r.read())
print(f"\nHOD profile id field: {d2.get('id')}")
print(f"HOD profile department: {d2.get('department')}")
print(f"Full profile: {json.dumps(d2, indent=2)}")
