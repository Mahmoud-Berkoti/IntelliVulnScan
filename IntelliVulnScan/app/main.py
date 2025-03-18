from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import os
from typing import List

from app.api.api import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import get_api_key

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files if in production
if settings.APP_ENV == "production":
    app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint that returns basic API information."""
    return {
        "message": "Welcome to the Intelligent Vulnerability Detection and Prioritization API",
        "docs": f"{settings.API_V1_STR}/docs",
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "ok"}

@app.get("/version", tags=["Version"])
async def version():
    """Return the current version of the API."""
    return {"version": "1.0.0"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Execute tasks on application startup."""
    logger.info("Starting IntelliVulnScan API")
    # Initialize database connection, load models, etc.

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Execute tasks on application shutdown."""
    logger.info("Shutting down IntelliVulnScan API")
    # Close database connections, etc.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    ) 