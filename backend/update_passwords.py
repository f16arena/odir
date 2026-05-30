from database import SessionLocal, User
import bcrypt

db = SessionLocal()

updates = [
    ('admin@odir.local',   'Admin@123'),
    ('doctor@odir.local',  'Doctor@123'),
    ('analyst@odir.local', 'Analyst@123'),
]

for email, pwd in updates:
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.password_hash = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
        print(f'Обновлён: {email} -> {pwd}')
    else:
        print(f'Не найден: {email}')

db.commit()
db.close()
print('Готово!')