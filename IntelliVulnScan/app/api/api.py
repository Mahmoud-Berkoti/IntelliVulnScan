from fastapi import APIRouter

from app.api.endpoints import scans, assets, vulnerabilities, ml

api_router = APIRouter()

api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(vulnerabilities.router, prefix="/vulnerabilities", tags=["vulnerabilities"])
api_router.include_router(ml.router, prefix="/ml", tags=["ml"]) 