from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pathlib import Path
import uuid
import numpy as np
from PIL import Image
import io

from database import get_db, Diagnosis, Patient, User, UserRole
from routers.auth import get_current_user, require_role
from ml.predict import run_predict
import storage

router = APIRouter()


class DiagnosisOut(BaseModel):
    id:               int
    patient_id:       int
    patient_name:     str
    doctor_name:      str
    image_path:       str
    gradcam_path:     Optional[str]
    probabilities:    dict
    detected_classes: list
    doctor_comment:   str
    created_at:       datetime

    class Config:
        from_attributes = True

class CommentUpdate(BaseModel):
    comment: str



@router.post("/predict/{patient_id}", response_model=DiagnosisOut)
async def predict(
    patient_id:   int,
    file:         UploadFile = File(...),
    db:           Session    = Depends(get_db),
    current_user: User       = Depends(require_role(UserRole.doctor, UserRole.admin)),
):
    """
    Принимает снимок глазного дна, запускает модель,
    генерирует Grad-CAM и сохраняет результат в БД.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    contents  = await file.read()
    image     = Image.open(io.BytesIO(contents)).convert("RGB")
    image_arr = np.array(image)

    img_filename = f"{uuid.uuid4()}.jpg"
    buf = io.BytesIO()
    image.save(buf, "JPEG", quality=95)
    image_url = storage.save_bytes(buf.getvalue(), f"uploads/{img_filename}", "image/jpeg")

    result = run_predict(image_arr, img_filename)

    diagnosis = Diagnosis(
        patient_id       = patient_id,
        doctor_id        = current_user.id,
        image_path       = image_url,
        gradcam_path     = result.get("gradcam_path"),
        probabilities    = result["probabilities"],
        detected_classes = result["detected_classes"],
        model_version    = result["model_version"],
    )
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)

    return _format_diagnosis(diagnosis, db)


@router.get("/patient/{patient_id}", response_model=list[DiagnosisOut])
def get_patient_diagnoses(
    patient_id:   int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """История диагнозов пациента."""
    diagnoses = (
        db.query(Diagnosis)
        .filter(Diagnosis.patient_id == patient_id)
        .order_by(Diagnosis.created_at.desc())
        .all()
    )
    return [_format_diagnosis(d, db) for d in diagnoses]


@router.get("/{diagnosis_id}", response_model=DiagnosisOut)
def get_diagnosis(
    diagnosis_id: int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Диагноз не найден")
    return _format_diagnosis(diagnosis, db)


@router.patch("/{diagnosis_id}/comment")
def update_comment(
    diagnosis_id: int,
    data:         CommentUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_role(UserRole.doctor, UserRole.admin)),
):
    """Врач добавляет комментарий к диагнозу."""
    diagnosis = db.query(Diagnosis).filter(Diagnosis.id == diagnosis_id).first()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Диагноз не найден")
    diagnosis.doctor_comment = data.comment
    db.commit()
    return {"message": "Комментарий сохранён"}


@router.get("/recent/list", response_model=list[DiagnosisOut])
def get_recent(
    limit:        int  = 20,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Последние диагнозы (для дашборда врача)."""
    query = db.query(Diagnosis).order_by(Diagnosis.created_at.desc())

    if current_user.role == UserRole.doctor:
        query = query.filter(Diagnosis.doctor_id == current_user.id)

    diagnoses = query.limit(limit).all()
    return [_format_diagnosis(d, db) for d in diagnoses]



def _format_diagnosis(d: Diagnosis, db: Session) -> dict:
    patient = db.query(Patient).filter(Patient.id == d.patient_id).first()
    doctor  = db.query(User).filter(User.id == d.doctor_id).first()
    return {
        "id":               d.id,
        "patient_id":       d.patient_id,
        "patient_name":     patient.full_name if patient else "—",
        "doctor_name":      doctor.full_name  if doctor  else "—",
        "image_path":       d.image_path,
        "gradcam_path":     d.gradcam_path,
        "probabilities":    d.probabilities    or {},
        "detected_classes": d.detected_classes or [],
        "doctor_comment":   d.doctor_comment   or "",
        "created_at":       d.created_at,
    }
