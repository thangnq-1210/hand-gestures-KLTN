from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .core.config import settings

# Tạo engine
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
)

# SessionLocal: mỗi request FastAPI sẽ lấy 1 session rồi đóng
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base cho các model kế thừa
Base = declarative_base()

# Dependency cho FastAPI
def get_db():
    from sqlalchemy.orm import Session
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
