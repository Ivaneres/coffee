from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from database import engine, Base
from routers import auth, beans, records, users
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Espresso Tracker API")

# CORS: browsers treat localhost vs 127.0.0.1 as different origins; strip env values;
# empty ALLOWED_ORIGINS in .env would otherwise become [""] and block all cross-origin requests.
_DEFAULT_DEV_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)
_raw_origins = os.getenv("ALLOWED_ORIGINS")
if _raw_origins is None:
    _raw_origins = ",".join(_DEFAULT_DEV_ORIGINS)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = list(_DEFAULT_DEV_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(beans.router, prefix="/api/beans", tags=["beans"])
app.include_router(records.router, prefix="/api/records", tags=["records"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
def read_root():
    return {"message": "Espresso Tracker API"}
