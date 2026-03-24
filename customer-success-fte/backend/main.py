from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import sys
from dotenv import load_dotenv

# Ensure the project root and current directory are in the path for module imports
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.append(project_root)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

load_dotenv(os.path.join(project_root, ".env"))

from routes.tickets import router as tickets_router
from routes.webhooks import router as webhooks_router
from routes.admin import router as admin_router
from database.connection import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("🔌 Closing connections")

app = FastAPI(
    title="Customer Success AI FTE",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Customer Success FTE"}

# Routes
app.include_router(tickets_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/webhooks")
app.include_router(admin_router, prefix="/api/v1/admin")

@app.get("/")
async def root():
    return {"message": "Customer Success AI FTE API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    host = os.getenv("API_HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
