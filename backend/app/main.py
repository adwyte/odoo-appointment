from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import appointments

app = FastAPI(title="Appointment App")

# Configure CORS
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Appointment App API"}
