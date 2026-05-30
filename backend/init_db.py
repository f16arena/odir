"""
Инициализация базы данных и создание первого администратора.
Запускать один раз: python init_db.py
"""

from database import init_db, SessionLocal, User, UserRole, ModelInfo
import bcrypt


def create_admin():
    db = SessionLocal()
    try:
        # Проверяем нет ли уже администратора
        existing = db.query(User).filter(User.role == UserRole.admin).first()
        if existing:
            print(f"Администратор уже существует: {existing.email}")
            return

        # Создаём первого администратора
        password_hash = bcrypt.hashpw("Admin@123".encode(), bcrypt.gensalt()).decode()
        admin = User(
            email         = "admin@odir.local",
            password_hash = password_hash,
            full_name     = "Администратор системы",
            role          = UserRole.admin,
        )
        db.add(admin)

        # Создаём тестового врача
        doctor_hash = bcrypt.hashpw("Doctor@123".encode(), bcrypt.gensalt()).decode()
        doctor = User(
            email         = "doctor@odir.local",
            password_hash = doctor_hash,
            full_name     = "Иванова Мария Сергеевна",
            role          = UserRole.doctor,
        )
        db.add(doctor)

        # Создаём аналитика
        analyst_hash = bcrypt.hashpw("Analyst@123".encode(), bcrypt.gensalt()).decode()
        analyst = User(
            email         = "analyst@odir.local",
            password_hash = analyst_hash,
            full_name     = "Аналитик данных",
            role          = UserRole.analyst,
        )
        db.add(analyst)

        # Записываем информацию о модели
        model_info = ModelInfo(
            name       = "EfficientNet-B0",
            version    = "v1.0",
            auc_score  = 0.9285,
            f1_score   = 0.6714,
            thresholds = {
                "N": 0.5, "D": 0.5, "G": 0.5, "C": 0.5,
                "A": 0.5, "H": 0.5, "M": 0.5, "O": 0.5,
            },
            is_active  = True,
        )
        db.add(model_info)

        db.commit()
        print("✅ База данных инициализирована!")
        print("\nТестовые пользователи:")
        print("  Администратор : admin@odir.local   / Admin@123")
        print("  Врач          : doctor@odir.local  / Doctor@123")
        print("  Аналитик      : analyst@odir.local / Analyst@123")

    finally:
        db.close()


if __name__ == "__main__":
    print("Создание таблиц...")
    init_db()
    print("Создание пользователей...")
    create_admin()
