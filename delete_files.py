import os

files_to_delete = [
    r'd:\hotel-krishna-restaruant\hotel\frontend\src\pages\admin\bookings\history.jsx',
    r'd:\hotel-krishna-restaruant\hotel\frontend\src\pages\admin\bookings\calendar.jsx',
    r'd:\hotel-krishna-restaruant\hotel\frontend\src\pages\admin\bookings\view.jsx',
    r'd:\hotel-krishna-restaruant\hotel\frontend\src\pages\admin\available-rooms.jsx'
]

for file in files_to_delete:
    try:
        if os.path.exists(file):
            os.remove(file)
            print(f"Deleted: {file}")
        else:
            print(f"Not found: {file}")
    except Exception as e:
        print(f"Error deleting {file}: {e}")

print("\nVerifying deletion...")
for file in files_to_delete:
    if os.path.exists(file):
        print(f"STILL EXISTS: {file}")
    else:
        print(f"DELETED: {file}")
