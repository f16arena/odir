from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    DateTime, ForeignKey, JSON, Boolean, Text, Enum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/odir_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()



class UserRole(str, enum.Enum):
    admin    = "admin"
    doctor   = "doctor"
    analyst  = "analyst"



class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name     = Column(String(255), nullable=False)
    role          = Column(Enum(UserRole), default=UserRole.doctor, nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    patients      = relationship("Patient", back_populates="doctor")
    diagnoses     = relationship("Diagnosis", back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"

    id          = Column(Integer, primary_key=True, index=True)
    full_name   = Column(String(255), nullable=False)
    birth_date  = Column(String(20))
    gender      = Column(String(10))
    notes       = Column(Text, default="")
    doctor_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    doctor      = relationship("User", back_populates="patients")
    diagnoses   = relationship("Diagnosis", back_populates="patient")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id               = Column(Integer, primary_key=True, index=True)
    patient_id       = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path       = Column(String(500), nullable=False)
    gradcam_path     = Column(String(500))

    probabilities    = Column(JSON)          
    detected_classes = Column(JSON)         
    model_version    = Column(String(50))

    doctor_comment   = Column(Text, default="")
    created_at       = Column(DateTime, default=datetime.utcnow)

    patient          = relationship("Patient", back_populates="diagnoses")
    doctor           = relationship("User", back_populates="diagnoses")


class ModelInfo(Base):
    __tablename__ = "model_info"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    version     = Column(String(50), nullable=False)
    auc_score   = Column(Float)
    f1_score    = Column(Float)
    thresholds  = Column(JSON)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def init_db():
    Base.metadata.create_all(bind=engine)
    print("Таблицы созданы")
