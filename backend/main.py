from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
import os
import uvicorn

from routers import auth, patients, diagnoses, analytics, users
from database import engine, Base
from ml.model import load_model
import state


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Загрузка ML модели...")
    state.model, state.config = load_model()
    print("Модель загружена")
    yield
    print("Сервер остановлен")

app = FastAPI(
    title="ODIR-5K Ophthalmology API",
    description="API для диагностики офтальмологических заболеваний",
    version="1.0.0",
    lifespan=lifespan,
)

# Разрешённые источники: локальный фронт + адрес из переменной окружения (Vercel).
# FRONTEND_URL может содержать несколько адресов через запятую.
_origins = ["http://localhost:3000"]
_env_origins = os.getenv("FRONTEND_URL", "")
_origins += [o.strip() for o in _env_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("gradcam", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/gradcam", StaticFiles(directory="gradcam"),  name="gradcam")

app.include_router(auth.router,       prefix="/api/auth",      tags=["Auth"])
app.include_router(users.router,      prefix="/api/users",     tags=["Users"])
app.include_router(patients.router,   prefix="/api/patients",  tags=["Patients"])
app.include_router(diagnoses.router,  prefix="/api/diagnoses", tags=["Diagnoses"])
app.include_router(analytics.router,  prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "ODIR-5K API работает", "docs": "/docs"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
