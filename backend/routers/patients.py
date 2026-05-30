from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db, Patient, User, UserRole
from routers.auth import get_current_user, require_role

router = APIRouter()

class PatientCreate(BaseModel):
    full_name:  str
    birth_date: Optional[str] = None
    gender:     Optional[str] = None
    notes:      Optional[str] = ""

class PatientOut(BaseModel):
    id:         int
    full_name:  str
    birth_date: Optional[str]
    gender:     Optional[str]
    notes:      str
    doctor_id:  int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=PatientOut)
def create_patient(
    data: PatientCreate,
    db:   Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.doctor, UserRole.admin)),
):
    """Создать нового пациента."""
    patient = Patient(**data.model_dump(), doctor_id=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/", response_model=list[PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Patient)
    if current_user.role == UserRole.doctor:
        query = query.filter(Patient.doctor_id == current_user.id)
    return query.order_by(Patient.created_at.desc()).all()


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.doctor, UserRole.admin)),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    db.delete(patient)
    db.commit()
    return {"message": "Пациент удалён"}
