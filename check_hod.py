import urllib.request, json, ssl
ctx = ssl._create_unverified_context()

# Check HOD profile
url = "https://ritgate-backend.onrender.com/api/hod/CS56"
with urllib.request.urlopen(url, context=ctx) as r:
    d = json.loads(r.read())
print("HOD profile:", json.dumps(d, indent=2))

# Check students count
url2 = "https://ritgate-backend.onrender.com/api/hod/CS56/department/students"
with urllib.request.urlopen(url2, context=ctx) as r:
    d2 = json.loads(r.read())
depts = set(s.get('department') for s in d2.get('students', []))
print(f"\nStudents count: {d2.get('count')}")
print(f"Departments in students: {depts}")

# Check staff
url3 = "https://ritgate-backend.onrender.com/api/hod/CS56/department/staff"
with urllib.request.urlopen(url3, context=ctx) as r:
    d3 = json.loads(r.read())
depts3 = set(s.get('department') for s in d3.get('staff', []))
print(f"\nStaff count: {d3.get('count')}")
print(f"Departments in staff: {depts3}")
