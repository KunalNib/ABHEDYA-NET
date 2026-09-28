"""
CHRONOS-WS Backend Application Foundation.
FastAPI + Pydantic + Structured Logging + Health Checks + Exception Handlers.
"""

import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db, check_database_connection
from app.api.endpoints import router as api_router

# Structured Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("CHRONOS-WS")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CHRONOS-WS Application Foundation...")
    init_db()
    yield
    logger.info("Shutting down CHRONOS-WS Application Foundation...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.FULL_TITLE,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "message": str(exc), "timestamp": datetime.now(timezone.utc).isoformat()}
    )

# Required Stage 1 Endpoints
@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    db_ok = check_database_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if db_ok else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/v1/system/status", status_code=status.HTTP_200_OK)
def system_status():
    db_ok = check_database_connection()
    return {
        "system": settings.PROJECT_NAME,
        "title": settings.FULL_TITLE,
        "version": settings.VERSION,
        "status": "operational" if db_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "data_plane": "operational",
            "intelligence_plane": "ready",
            "control_plane": "operational",
            "deception_engine": "standby",
            "database": "connected" if db_ok else "disconnected"
        }
    }

# Mount API Router and Root WebSocket
from app.api.endpoints import websocket_endpoint
app.websocket("/ws")(websocket_endpoint)
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

