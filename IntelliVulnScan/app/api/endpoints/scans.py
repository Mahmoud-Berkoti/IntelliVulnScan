from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.scan import (
    ScanCreate,
    ScanUpdate,
    ScanResponse,
    ScanResultResponse,
)
from app.services.scan_service import (
    create_scan,
    get_scan,
    get_scans,
    update_scan,
    delete_scan,
    start_scan,
    stop_scan,
    get_scan_results,
)
from app.tasks.scan_tasks import run_scan_task

router = APIRouter()


@router.get("/", response_model=List[ScanResponse])
async def read_scans(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    scanner_type: Optional[str] = None,
    asset_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve scans with optional filtering.
    """
    filters = {}
    if status:
        filters["status"] = status
    if scanner_type:
        filters["scanner_type"] = scanner_type
    if asset_id:
        filters["asset_id"] = asset_id
        
    return get_scans(db, skip=skip, limit=limit, filters=filters)


@router.get("/{scan_id}", response_model=ScanResponse)
async def read_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve a specific scan by ID.
    """
    scan = get_scan(db, scan_id=scan_id)
    if scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    return scan


@router.post("/", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan_endpoint(
    scan: ScanCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new scan configuration.
    """
    return create_scan(db, scan=scan)


@router.put("/{scan_id}", response_model=ScanResponse)
async def update_scan_endpoint(
    scan_id: int,
    scan: ScanUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update an existing scan configuration.
    """
    db_scan = get_scan(db, scan_id=scan_id)
    if db_scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    return update_scan(db, scan_id=scan_id, scan=scan)


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan_endpoint(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a scan configuration.
    """
    db_scan = get_scan(db, scan_id=scan_id)
    if db_scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    delete_scan(db, scan_id=scan_id)
    return None


@router.post("/{scan_id}/start", response_model=ScanResponse)
async def start_scan_endpoint(
    scan_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Start a scan.
    """
    scan = get_scan(db, scan_id=scan_id)
    if scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    
    # Update scan status to "running"
    updated_scan = start_scan(db, scan_id=scan_id)
    
    # Start scan in background
    background_tasks.add_task(run_scan_task, scan_id=scan_id)
    
    return updated_scan


@router.post("/{scan_id}/stop", response_model=ScanResponse)
async def stop_scan_endpoint(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Stop a running scan.
    """
    scan = get_scan(db, scan_id=scan_id)
    if scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    
    if scan.status != "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Scan is not running",
        )
    
    return stop_scan(db, scan_id=scan_id)


@router.get("/{scan_id}/results", response_model=ScanResultResponse)
async def scan_results_endpoint(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get the results of a scan.
    """
    scan = get_scan(db, scan_id=scan_id)
    if scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    
    results = get_scan_results(db, scan_id=scan_id)
    if results is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan results not found",
        )
    
    return results 