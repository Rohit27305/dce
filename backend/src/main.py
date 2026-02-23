"""
Main FastAPI application entry point.
This file initializes the FastAPI app, sets up middleware, includes routers, and configures CORS.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging
import time

# Import specific modules (placeholders for now if they don't exist yet)
try:
    from src.api import auth, repositories, webhooks, documentation, metrics
except ImportError:
    # We'll create these files soon
    auth = repositories = webhooks = documentation = metrics = None

from src.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Documentation Consistency Enforcer API",
    description="AI-powered documentation synchronization system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
if settings and settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

from src.core.exceptions import BaseAPIException
from src.core.responses import error_response


# Production-grade Global Exception Handler
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            message=exc.detail,
            error_code=exc.error_code,
            status_code=exc.status_code,
            extra=exc.extra
        )
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    status_code = 500
    message = "An internal server error occurred."
    error_code = "INTERNAL_ERROR"
    
    if settings.DEBUG:
        message = str(exc)
        error_code = exc.__class__.__name__
        
    return JSONResponse(
        status_code=status_code,
        content=error_response(
            message=message,
            error_code=error_code,
            status_code=status_code
        )
    )

# Middlewares for logging and performance monitoring
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Path: {request.url.path} - Duration: {process_time:.4f}s")
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": time.time()
    }

# Include API routers (only if they are imported successfully)
if auth:
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
if repositories:
    app.include_router(repositories.router, prefix="/api/repositories", tags=["Repositories"])
if webhooks:
    app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
if documentation:
    app.include_router(documentation.router, prefix="/api/documentation-updates", tags=["Documentation"])
if metrics:
    app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Documentation Consistency Enforcer API")
    # Database table creation would happen here or via migrations

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Documentation Consistency Enforcer API")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings and settings.DEBUG else False
    )
