import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

logger = logging.getLogger(__name__)


def create_asset(db: Session, asset: AssetCreate) -> Asset:
    """
    Create a new asset.
    
    Args:
        db: Database session
        asset: Asset data
        
    Returns:
        Created asset
    """
    db_asset = Asset(
        name=asset.name,
        description=asset.description,
        asset_type=asset.asset_type,
        hostname=asset.hostname,
        ip_address=asset.ip_address,
        operating_system=asset.operating_system,
        owner=asset.owner,
        environment=asset.environment,
        criticality=asset.criticality,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    logger.info(f"Created asset with ID {db_asset.id}")
    return db_asset


def get_asset(db: Session, asset_id: int) -> Optional[Asset]:
    """
    Get an asset by ID.
    
    Args:
        db: Database session
        asset_id: ID of the asset
        
    Returns:
        Asset if found, None otherwise
    """
    return db.query(Asset).filter(Asset.id == asset_id).first()


def get_assets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Asset]:
    """
    Get assets with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        filters: Optional filters
        
    Returns:
        List of assets
    """
    query = db.query(Asset)
    
    if filters:
        if "asset_type" in filters:
            query = query.filter(Asset.asset_type == filters["asset_type"])
        if "environment" in filters:
            query = query.filter(Asset.environment == filters["environment"])
        if "criticality" in filters:
            query = query.filter(Asset.criticality == filters["criticality"])
        if "owner" in filters:
            query = query.filter(Asset.owner == filters["owner"])
    
    return query.offset(skip).limit(limit).all()


def update_asset(db: Session, asset_id: int, asset: AssetUpdate) -> Optional[Asset]:
    """
    Update an asset.
    
    Args:
        db: Database session
        asset_id: ID of the asset to update
        asset: Updated asset data
        
    Returns:
        Updated asset if found, None otherwise
    """
    db_asset = get_asset(db, asset_id)
    if not db_asset:
        return None
    
    # Update fields
    for field, value in asset.dict(exclude_unset=True).items():
        setattr(db_asset, field, value)
    
    db_asset.updated_at = datetime.now()
    db.commit()
    db.refresh(db_asset)
    logger.info(f"Updated asset with ID {db_asset.id}")
    return db_asset


def delete_asset(db: Session, asset_id: int) -> bool:
    """
    Delete an asset.
    
    Args:
        db: Database session
        asset_id: ID of the asset to delete
        
    Returns:
        True if deleted, False otherwise
    """
    db_asset = get_asset(db, asset_id)
    if not db_asset:
        return False
    
    db.delete(db_asset)
    db.commit()
    logger.info(f"Deleted asset with ID {asset_id}")
    return True


def get_asset_vulnerability_summary(db: Session, asset_id: int) -> Optional[Dict[str, Any]]:
    """
    Get a summary of vulnerabilities for an asset.
    
    Args:
        db: Database session
        asset_id: ID of the asset
        
    Returns:
        Vulnerability summary if asset found, None otherwise
    """
    db_asset = get_asset(db, asset_id)
    if not db_asset:
        return None
    
    # Get vulnerability counts by severity
    critical_count = sum(1 for vuln in db_asset.vulnerabilities if vuln.severity == "critical")
    high_count = sum(1 for vuln in db_asset.vulnerabilities if vuln.severity == "high")
    medium_count = sum(1 for vuln in db_asset.vulnerabilities if vuln.severity == "medium")
    low_count = sum(1 for vuln in db_asset.vulnerabilities if vuln.severity == "low")
    
    # Get open vs closed counts
    open_count = sum(1 for vuln in db_asset.vulnerabilities if vuln.status == "open")
    closed_count = sum(1 for vuln in db_asset.vulnerabilities if vuln.status == "closed")
    
    # Calculate risk score (simple weighted calculation)
    risk_score = (
        critical_count * 10 +
        high_count * 5 +
        medium_count * 2 +
        low_count * 0.5
    )
    
    # Create summary
    summary = {
        "asset_id": db_asset.id,
        "asset_name": db_asset.name,
        "total_vulnerabilities": len(db_asset.vulnerabilities),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "open_count": open_count,
        "closed_count": closed_count,
        "risk_score": risk_score,
        "last_scan": None,
    }
    
    # Get last scan information if available
    if db_asset.scans:
        last_scan = max(db_asset.scans, key=lambda scan: scan.created_at)
        summary["last_scan"] = {
            "scan_id": last_scan.id,
            "scan_name": last_scan.name,
            "scan_date": last_scan.created_at,
            "status": last_scan.status,
        }
    
    return summary 