from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.vulnerability import Vulnerability, VulnerabilityCreate, VulnerabilityUpdate
from app.services import (
    create_vulnerability,
    get_vulnerability,
    get_vulnerabilities,
    update_vulnerability,
    delete_vulnerability,
    update_vulnerability_status,
    update_vulnerability_priority,
    get_vulnerability_details,
)

router = APIRouter()


@router.post("/", response_model=Vulnerability, status_code=201)
def create_vulnerability_endpoint(
    vulnerability: VulnerabilityCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new vulnerability.
    """
    return create_vulnerability(db=db, vulnerability=vulnerability)


@router.get("/{vulnerability_id}", response_model=Dict[str, Any])
def read_vulnerability(
    vulnerability_id: int,
    db: Session = Depends(get_db),
):
    """
    Get vulnerability by ID with detailed information.
    """
    vulnerability_details = get_vulnerability_details(db=db, vulnerability_id=vulnerability_id)
    if vulnerability_details is None:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vulnerability_details


@router.get("/", response_model=List[Vulnerability])
def read_vulnerabilities(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    asset_id: Optional[int] = None,
    scan_id: Optional[int] = None,
    cve_id: Optional[str] = None,
    min_cvss: Optional[float] = None,
    max_cvss: Optional[float] = None,
    exploit_available: Optional[bool] = None,
    patch_available: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    Get all vulnerabilities with optional filtering.
    """
    filters = {}
    if severity:
        filters["severity"] = severity
    if status:
        filters["status"] = status
    if asset_id:
        filters["asset_id"] = asset_id
    if scan_id:
        filters["scan_id"] = scan_id
    if cve_id:
        filters["cve_id"] = cve_id
    if min_cvss is not None:
        filters["min_cvss"] = min_cvss
    if max_cvss is not None:
        filters["max_cvss"] = max_cvss
    if exploit_available is not None:
        filters["exploit_available"] = exploit_available
    if patch_available is not None:
        filters["patch_available"] = patch_available
    
    return get_vulnerabilities(db=db, skip=skip, limit=limit, filters=filters)


@router.put("/{vulnerability_id}", response_model=Vulnerability)
def update_vulnerability_endpoint(
    vulnerability_id: int,
    vulnerability: VulnerabilityUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a vulnerability.
    """
    db_vulnerability = update_vulnerability(db=db, vulnerability_id=vulnerability_id, vulnerability=vulnerability)
    if db_vulnerability is None:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return db_vulnerability


@router.delete("/{vulnerability_id}", status_code=204)
def delete_vulnerability_endpoint(
    vulnerability_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a vulnerability.
    """
    success = delete_vulnerability(db=db, vulnerability_id=vulnerability_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return None


@router.put("/{vulnerability_id}/status", response_model=Vulnerability)
def update_vulnerability_status_endpoint(
    vulnerability_id: int,
    status: str = Body(..., embed=True),
    notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """
    Update vulnerability status.
    """
    db_vulnerability = update_vulnerability_status(
        db=db, vulnerability_id=vulnerability_id, status=status, notes=notes
    )
    if db_vulnerability is None:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return db_vulnerability


@router.put("/{vulnerability_id}/priority", response_model=Vulnerability)
def update_vulnerability_priority_endpoint(
    vulnerability_id: int,
    priority: float = Body(..., embed=True),
    explanation: Optional[Dict[str, Any]] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """
    Update vulnerability priority.
    """
    db_vulnerability = update_vulnerability_priority(
        db=db, vulnerability_id=vulnerability_id, priority=priority, explanation=explanation
    )
    if db_vulnerability is None:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return db_vulnerability 