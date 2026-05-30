from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db, Diagnosis, Patient, User, UserRole
from routers.auth import get_current_user, require_role

router = APIRouter()
CLASS_NAMES = {"N":"Normal","D":"Diabetes","G":"Glaucoma","C":"Cataract","A":"AMD","H":"Hypertension","M":"Myopia","O":"Other"}
DISPLAY_CLASSES = ["N","D","G","C","A","H","M"]

@router.get("/summary")
def get_summary(db:Session=Depends(get_db), current_user:User=Depends(get_current_user)):
    base_q = db.query(Diagnosis)
    pat_q  = db.query(Patient)
    if current_user.role == UserRole.doctor:
        base_q = base_q.filter(Diagnosis.doctor_id==current_user.id)
        pat_q  = pat_q.filter(Patient.doctor_id==current_user.id)
    week_ago = datetime.utcnow() - timedelta(days=7)
    return {
        "total_diagnoses": base_q.count(),
        "total_patients":  pat_q.count(),
        "total_users":     db.query(User).count() if current_user.role in [UserRole.admin, UserRole.analyst] else None,
        "diagnoses_week":  base_q.filter(Diagnosis.created_at>=week_ago).count(),
    }

@router.get("/class-distribution")
def get_class_distribution(db:Session=Depends(get_db), current_user:User=Depends(get_current_user)):
    query = db.query(Diagnosis)
    if current_user.role == UserRole.doctor:
        query = query.filter(Diagnosis.doctor_id==current_user.id)
    counts = {cls:0 for cls in DISPLAY_CLASSES}
    for d in query.all():
        for cls in (d.detected_classes or []):
            if cls in counts: counts[cls]+=1
    return [{"class":cls,"name":CLASS_NAMES[cls],"count":cnt} for cls,cnt in sorted(counts.items(),key=lambda x:-x[1]) if cnt>0]

@router.get("/diagnoses-over-time")
def get_diagnoses_over_time(days:int=30, db:Session=Depends(get_db), current_user:User=Depends(get_current_user)):
    since = datetime.utcnow()-timedelta(days=days)
    query = db.query(Diagnosis).filter(Diagnosis.created_at>=since)
    if current_user.role==UserRole.doctor: query=query.filter(Diagnosis.doctor_id==current_user.id)
    by_date={}
    for d in query.all():
        k=d.created_at.strftime("%Y-%m-%d"); by_date[k]=by_date.get(k,0)+1
    return [{"date":(datetime.utcnow()-timedelta(days=days-1-i)).strftime("%Y-%m-%d"),"count":by_date.get((datetime.utcnow()-timedelta(days=days-1-i)).strftime("%Y-%m-%d"),0)} for i in range(days)]

@router.get("/model-metrics")
def get_model_metrics(current_user:User=Depends(require_role(UserRole.admin,UserRole.analyst))):
    return {
        "model_name":"EfficientNet-B0","auc_macro":0.9285,"f1_macro":0.6714,"recall_macro":0.8735,"precision_macro":0.5550,
        "per_class":[
            {"class":"N","name":"Normal",      "auc":0.8629,"f1":0.6809,"precision":0.6184,"recall":0.7575},
            {"class":"D","name":"Diabetes",    "auc":0.8467,"f1":0.6654,"precision":0.5676,"recall":0.8038},
            {"class":"G","name":"Glaucoma",    "auc":0.9882,"f1":0.6903,"precision":0.5431,"recall":0.9469},
            {"class":"C","name":"Cataract",    "auc":0.9781,"f1":0.8214,"precision":0.7372,"recall":0.9274},
            {"class":"A","name":"AMD",         "auc":0.9683,"f1":0.6641,"precision":0.5179,"recall":0.9255},
            {"class":"H","name":"Hypertension","auc":0.9572,"f1":0.4720,"precision":0.3242,"recall":0.8876},
            {"class":"M","name":"Myopia",      "auc":0.9970,"f1":0.7815,"precision":0.6503,"recall":0.9789},
        ]
    }

@router.get("/patients-stats")
def get_patients_stats(db:Session=Depends(get_db), current_user:User=Depends(get_current_user)):
    query = db.query(Patient)
    if current_user.role==UserRole.doctor: query=query.filter(Patient.doctor_id==current_user.id)
    patients=query.all()
    gender={"Female":0,"Male":0}
    age_groups={"0-20":0,"21-40":0,"41-60":0,"61-80":0,"80+":0}
    for p in patients:
        gender[p.gender or "Male"]=gender.get(p.gender or "Male",0)+1
        if p.birth_date:
            try:
                age=(datetime.utcnow()-datetime.strptime(p.birth_date,"%Y-%m-%d")).days//365
                if age<=20: age_groups["0-20"]+=1
                elif age<=40: age_groups["21-40"]+=1
                elif age<=60: age_groups["41-60"]+=1
                elif age<=80: age_groups["61-80"]+=1
                else: age_groups["80+"]+=1
            except: pass
    return {
        "total":len(patients),
        "gender":[{"name":k,"value":v} for k,v in gender.items()],
        "age_groups":[{"group":k,"count":v} for k,v in age_groups.items()],
    }

@router.get("/doctors-stats")
def get_doctors_stats(db:Session=Depends(get_db), current_user:User=Depends(require_role(UserRole.admin,UserRole.analyst))):
    doctors=db.query(User).filter(User.role==UserRole.doctor).all()
    result=[]
    for doc in doctors:
        pc=db.query(Patient).filter(Patient.doctor_id==doc.id).count()
        dc=db.query(Diagnosis).filter(Diagnosis.doctor_id==doc.id).count()
        last=db.query(Diagnosis).filter(Diagnosis.doctor_id==doc.id).order_by(Diagnosis.created_at.desc()).first()
        result.append({"id":doc.id,"name":doc.full_name,"email":doc.email,"patient_count":pc,"diagnosis_count":dc,"last_active":last.created_at.strftime("%Y-%m-%d") if last else "—"})
    return sorted(result,key=lambda x:-x["diagnosis_count"])

@router.get("/diagnoses-by-doctor")
def get_diagnoses_by_doctor(db:Session=Depends(get_db), current_user:User=Depends(require_role(UserRole.admin,UserRole.analyst))):
    doctors=db.query(User).filter(User.role==UserRole.doctor).all()
    result=[{"name":doc.full_name.split()[0],"count":db.query(Diagnosis).filter(Diagnosis.doctor_id==doc.id).count()} for doc in doctors]
    return sorted([r for r in result if r["count"]>0],key=lambda x:-x["count"])
