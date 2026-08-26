from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import health, auth, subjects, batches, lectures

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0"
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(batches.router)
app.include_router(lectures.router)


@app.get("/")
def root():
    return {"message": "Welcome to SABHA API"}
