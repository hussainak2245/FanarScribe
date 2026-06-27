from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.scribe import router as scribe_router
from app.routers.encounters import router as encounters_router
from app.routers.intake import router as intake_router
from app.routers.notes import router as notes_router
from app.routers.copilot import router as copilot_router
from app.routers.stats import router as stats_router

app = FastAPI(
    title="FanarScribe API",
    version="0.2.0",
    description="Arabic-first clinical scribe backend with transcription, SOAP generation, and uncertainty output.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict before production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scribe_router, prefix="/api/v1/scribe", tags=["scribe"])
app.include_router(encounters_router, prefix="/api/v1/encounters", tags=["encounters"])
app.include_router(intake_router, prefix="/api/v1/patient-intake", tags=["intake"])
app.include_router(notes_router, prefix="/api/v1/notes", tags=["notes"])
app.include_router(copilot_router, prefix="/api/v1/copilot", tags=["copilot"])
app.include_router(stats_router, prefix="/api/v1/stats", tags=["stats"])


@app.get("/")
def root():
    return {"name": "FanarScribe API", "status": "running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
