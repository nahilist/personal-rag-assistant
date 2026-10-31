import sqlite3

conn = sqlite3.connect("apps/api/data/personal_rag.db")
c = conn.cursor()

c.execute("SELECT id, title, status FROM documents WHERE user_id = '22222222-2222-2222-2222-222222222222'")
rows = c.fetchall()
print("Bob documents count:", len(rows))
for r in rows:
    print(" ", r)

# Delete stuck 'uploading' and 'deleting' documents so Bob can retry clean
c.execute("DELETE FROM documents WHERE user_id = '22222222-2222-2222-2222-222222222222' AND status IN ('uploading', 'deleting')")
c.execute("DELETE FROM quota_reservations WHERE user_id = '22222222-2222-2222-2222-222222222222'")
deleted = c.rowcount
conn.commit()
print(f"Cleaned up {deleted} documents for Bob.")
