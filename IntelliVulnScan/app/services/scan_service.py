import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy.orm import Session

from app.models.scan import Scan
from app.models.vulnerability import Vulnerability
from app.schemas.scan import ScanCreate, ScanUpdate

logger = logging.getLogger(__name__)


def create_scan(db: Session, scan: ScanCreate) -> Scan:
    """
    Create a new scan.
    
    Args:
        db: Database session
        scan: Scan data
        
    Returns:
        Created scan
    """
    db_scan = Scan(
        name=scan.name,
        description=scan.description,
        scanner_type=scan.scanner_type,
        asset_id=scan.asset_id,
        target_type=scan.target_type,
        target_identifier=scan.target_identifier,
        scan_frequency=scan.scan_frequency,
        scan_depth=scan.scan_depth,
        scanner_config=scan.scanner_config,
        status="pending",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    logger.info(f"Created scan with ID {db_scan.id}")
    return db_scan


def get_scan(db: Session, scan_id: int) -> Optional[Scan]:
    """
    Get a scan by ID.
    
    Args:
        db: Database session
        scan_id: ID of the scan
        
    Returns:
        Scan if found, None otherwise
    """
    return db.query(Scan).filter(Scan.id == scan_id).first()


def get_scans(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Scan]:
    """
    Get scans with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        filters: Optional filters
        
    Returns:
        List of scans
    """
    query = db.query(Scan)
    
    if filters:
        if "status" in filters:
            query = query.filter(Scan.status == filters["status"])
        if "scanner_type" in filters:
            query = query.filter(Scan.scanner_type == filters["scanner_type"])
        if "asset_id" in filters:
            query = query.filter(Scan.asset_id == filters["asset_id"])
    
    return query.offset(skip).limit(limit).all()


def update_scan(db: Session, scan_id: int, scan: ScanUpdate) -> Optional[Scan]:
    """
    Update a scan.
    
    Args:
        db: Database session
        scan_id: ID of the scan to update
        scan: Updated scan data
        
    Returns:
        Updated scan if found, None otherwise
    """
    db_scan = get_scan(db, scan_id)
    if not db_scan:
        return None
    
    # Update fields
    for field, value in scan.dict(exclude_unset=True).items():
        setattr(db_scan, field, value)
    
    db_scan.updated_at = datetime.now()
    db.commit()
    db.refresh(db_scan)
    logger.info(f"Updated scan with ID {db_scan.id}")
    return db_scan


def delete_scan(db: Session, scan_id: int) -> bool:
    """
    Delete a scan.
    
    Args:
        db: Database session
        scan_id: ID of the scan to delete
        
    Returns:
        True if deleted, False otherwise
    """
    db_scan = get_scan(db, scan_id)
    if not db_scan:
        return False
    
    db.delete(db_scan)
    db.commit()
    logger.info(f"Deleted scan with ID {scan_id}")
    return True


def start_scan(db: Session, scan_id: int) -> Optional[Scan]:
    """
    Start a scan.
    
    Args:
        db: Database session
        scan_id: ID of the scan to start
        
    Returns:
        Updated scan if found, None otherwise
    """
    db_scan = get_scan(db, scan_id)
    if not db_scan:
        return None
    
    db_scan.status = "running"
    db_scan.started_at = datetime.now()
    db_scan.updated_at = datetime.now()
    db.commit()
    db.refresh(db_scan)
    logger.info(f"Started scan with ID {db_scan.id}")
    return db_scan


def stop_scan(db: Session, scan_id: int) -> Optional[Scan]:
    """
    Stop a running scan.
    
    Args:
        db: Database session
        scan_id: ID of the scan to stop
        
    Returns:
        Updated scan if found, None otherwise
    """
    db_scan = get_scan(db, scan_id)
    if not db_scan:
        return None
    
    db_scan.status = "stopped"
    db_scan.updated_at = datetime.now()
    db.commit()
    db.refresh(db_scan)
    logger.info(f"Stopped scan with ID {db_scan.id}")
    return db_scan


def update_scan_status(
    db: Session,
    scan_id: int,
    status: str,
    message: Optional[str] = None,
    vulnerabilities_count: Optional[int] = None,
    critical_count: Optional[int] = None,
    high_count: Optional[int] = None,
    medium_count: Optional[int] = None,
    low_count: Optional[int] = None,
) -> Optional[Scan]:
    """
    Update scan status.
    
    Args:
        db: Database session
        scan_id: ID of the scan
        status: New status
        message: Optional message
        vulnerabilities_count: Optional count of vulnerabilities
        critical_count: Optional count of critical vulnerabilities
        high_count: Optional count of high vulnerabilities
        medium_count: Optional count of medium vulnerabilities
        low_count: Optional count of low vulnerabilities
        
    Returns:
        Updated scan if found, None otherwise
    """
    db_scan = get_scan(db, scan_id)
    if not db_scan:
        return None
    
    db_scan.status = status
    db_scan.updated_at = datetime.now()
    
    if status == "completed":
        db_scan.completed_at = datetime.now()
    
    if vulnerabilities_count is not None:
        db_scan.vulnerabilities_count = vulnerabilities_count
    
    if critical_count is not None:
        db_scan.critical_count = critical_count
    
    if high_count is not None:
        db_scan.high_count = high_count
    
    if medium_count is not None:
        db_scan.medium_count = medium_count
    
    if low_count is not None:
        db_scan.low_count = low_count
    
    db.commit()
    db.refresh(db_scan)
    logger.info(f"Updated scan status to {status} for scan with ID {db_scan.id}")
    return db_scan


def get_scan_results(db: Session, scan_id: int) -> Optional[Dict[str, Any]]:
    """
    Get scan results.
    
    Args:
        db: Database session
        scan_id: ID of the scan
        
    Returns:
        Scan results if found, None otherwise
    """
    db_scan = get_scan(db, scan_id)
    if not db_scan:
        return None
    
    # Get vulnerabilities
    vulnerabilities = (
        db.query(Vulnerability)
        .filter(Vulnerability.scan_id == scan_id)
        .all()
    )
    
    # Create vulnerability summaries
    vulnerability_summaries = []
    for vuln in vulnerabilities:
        vulnerability_summaries.append({
            "id": vuln.id,
            "title": vuln.title,
            "severity": vuln.severity,
            "cvss_score": vuln.cvss_score,
            "cve_id": vuln.cve_id,
            "status": vuln.status,
            "priority_score": vuln.priority,
        })
    
    # Create scan result
    result = {
        "scan_id": db_scan.id,
        "scan_name": db_scan.name,
        "status": db_scan.status,
        "started_at": db_scan.started_at,
        "completed_at": db_scan.completed_at,
        "total_vulnerabilities": db_scan.vulnerabilities_count,
        "critical_count": db_scan.critical_count,
        "high_count": db_scan.high_count,
        "medium_count": db_scan.medium_count,
        "low_count": db_scan.low_count,
        "vulnerabilities": vulnerability_summaries,
    }
    
    return result


def create_vulnerability_from_finding(
    db: Session,
    scan_id: int,
    asset_id: int,
    finding: Dict[str, Any],
) -> Vulnerability:
    """
    Create a vulnerability from a scan finding.
    
    Args:
        db: Database session
        scan_id: ID of the scan
        asset_id: ID of the asset
        finding: Finding data
        
    Returns:
        Created vulnerability
    """
    # Create vulnerability
    vulnerability = Vulnerability(
        title=finding.get("title", "Unknown"),
        description=finding.get("description", ""),
        cve_id=finding.get("cve_id", ""),
        severity=finding.get("severity", "low"),
        cvss_score=finding.get("cvss_score", 0.0),
        cvss_vector=finding.get("cvss_vector", ""),
        asset_id=asset_id,
        scan_id=scan_id,
        status="open",
        exploit_available=finding.get("exploit_available", False),
        exploit_maturity=finding.get("exploit_maturity", ""),
        patch_available=finding.get("patch_available", False),
        affected_component=finding.get("affected_component", ""),
        affected_version=finding.get("affected_version", ""),
        business_impact=finding.get("business_impact", ""),
        data_classification=finding.get("data_classification", ""),
        system_exposure=finding.get("system_exposure", ""),
        metadata=finding.get("metadata", {}),
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    
    db.add(vulnerability)
    db.commit()
    db.refresh(vulnerability)
    logger.info(f"Created vulnerability with ID {vulnerability.id}")
    return vulnerability 