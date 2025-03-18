from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.asset import Asset, AssetCreate, AssetUpdate, AssetVulnerabilitySummary
from app.services import (
    create_asset,
    get_asset,
    get_assets,
    update_asset,
    delete_asset,
    get_asset_vulnerability_summary,
)

router = APIRouter()


@router.post("/", response_model=Asset, status_code=201)
def create_asset_endpoint(
    asset: AssetCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new asset.
    """
    return create_asset(db=db, asset=asset)


@router.get("/{asset_id}", response_model=Asset)
def read_asset(
    asset_id: int,
    db: Session = Depends(get_db),
):
    """
    Get asset by ID.
    """
    db_asset = get_asset(db=db, asset_id=asset_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset


@router.get("/", response_model=List[Asset])
def read_assets(
    skip: int = 0,
    limit: int = 100,
    asset_type: Optional[str] = None,
    environment: Optional[str] = None,
    criticality: Optional[str] = None,
    owner: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get all assets with optional filtering.
    """
    filters = {}
    if asset_type:
        filters["asset_type"] = asset_type
    if environment:
        filters["environment"] = environment
    if criticality:
        filters["criticality"] = criticality
    if owner:
        filters["owner"] = owner
    
    return get_assets(db=db, skip=skip, limit=limit, filters=filters)


@router.put("/{asset_id}", response_model=Asset)
def update_asset_endpoint(
    asset_id: int,
    asset: AssetUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an asset.
    """
    db_asset = update_asset(db=db, asset_id=asset_id, asset=asset)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset


@router.delete("/{asset_id}", status_code=204)
def delete_asset_endpoint(
    asset_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete an asset.
    """
    success = delete_asset(db=db, asset_id=asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return None


@router.get("/{asset_id}/vulnerability-summary", response_model=AssetVulnerabilitySummary)
def read_asset_vulnerability_summary(
    asset_id: int,
    db: Session = Depends(get_db),
):
    """
    Get vulnerability summary for an asset.
    """
    summary = get_asset_vulnerability_summary(db=db, asset_id=asset_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return summary 