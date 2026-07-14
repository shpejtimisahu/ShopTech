from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.db.session import engine, SessionLocal
from app.models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)
    _create_default_admin()


def _create_default_admin():
    from app.core.config import settings
    from app.utils.hash import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if not existing:
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print(f"✅ Default admin created: {settings.ADMIN_USERNAME}")
        else:
            if not existing.is_admin:
                existing.is_admin = True
                db.commit()
    finally:
        db.close()