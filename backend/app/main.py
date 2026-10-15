"""FastAPI entry point for MachinaSense Backend."""

from contextlib import asynccontextmanager
from typing import Dict
from fastapi import FastAPI, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events manager for database connections, ML models, and workers."""
    # Startup actions
    print(f"[INFO] Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    yield
    # Shutdown actions
    print(f"[INFO] Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MachinaSense: Intelligent Industrial Fault Detection & Predictive Maintenance API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend clients (React, Vite, Next.js, Vue)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR, tags=["API v1"])


@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    tags=["System"],
)
async def health_check() -> Dict[str, str]:
    """Basic health check probe for orchestration and uptime verification."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["System"])
async def root() -> Dict[str, str]:
    """Root redirect / index message pointing to OpenAPI docs."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}. View docs at /docs or /redoc."
    }


@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Real-time WebSocket stream broadcasting live telemetry packets and alert notifications."""
    from app.services.websocket_manager import ws_manager

    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep socket alive and allow client ping/heartbeat
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)

