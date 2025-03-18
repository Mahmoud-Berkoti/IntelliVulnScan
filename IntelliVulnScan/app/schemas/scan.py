from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator


class ScanBase(BaseModel):
    """Base Scan schema with common attributes."""
    
    name: str = Field(..., description="Name of the scan")
    description: Optional[str] = Field(None, description="Description of the scan")
    scanner_type: str = Field(..., description="Type of scanner (trivy, openvas, dependency-check, custom)")
    
    # Target information
    asset_id: Optional[int] = Field(None, description="ID of the asset to scan")
    target_type: str = Field(..., description="Type of target (container, host, application, repository)")
    target_identifier: str = Field(..., description="Identifier for the target (URL, IP, container ID, etc.)")
    
    # Scan configuration
    scan_frequency: Optional[str] = Field(None, description="Frequency for scheduled scans (once, daily, weekly, monthly)")
    scan_depth: Optional[str] = Field("normal", description="Depth of the scan (quick, normal, deep)")
    
    # Scanner-specific configuration
    scanner_config: Dict[str, Any] = Field(default_factory=dict, description="Scanner-specific configuration")
    
    @validator("scanner_type")
    def validate_scanner_type(cls, v):
        allowed_values = ["trivy", "openvas", "dependency-check", "custom"]
        if v.lower() not in allowed_values:
            raise ValueError(f"Scanner type must be one of {allowed_values}")
        return v.lower()
    
    @validator("target_type")
    def validate_target_type(cls, v):
        allowed_values = ["container", "host", "application", "repository"]
        if v.lower() not in allowed_values:
            raise ValueError(f"Target type must be one of {allowed_values}")
        return v.lower()
    
    @validator("scan_frequency")
    def validate_scan_frequency(cls, v):
        if v is None:
            return v
        allowed_values = ["once", "daily", "weekly", "monthly"]
        if v.lower() not in allowed_values:
            raise ValueError(f"Scan frequency must be one of {allowed_values}")
        return v.lower()
    
    @validator("scan_depth")
    def validate_scan_depth(cls, v):
        if v is None:
            return "normal"
        allowed_values = ["quick", "normal", "deep"]
        if v.lower() not in allowed_values:
            raise ValueError(f"Scan depth must be one of {allowed_values}")
        return v.lower()


class ScanCreate(ScanBase):
    """Schema for creating a new scan."""
    pass


class ScanUpdate(BaseModel):
    """Schema for updating an existing scan."""
    
    name: Optional[str] = None
    description: Optional[str] = None
    
    scan_frequency: Optional[str] = None
    scan_depth: Optional[str] = None
    
    scanner_config: Optional[Dict[str, Any]] = None
    
    @validator("scan_frequency")
    def validate_scan_frequency(cls, v):
        if v is None:
            return v
        allowed_values = ["once", "daily", "weekly", "monthly"]
        if v.lower() not in allowed_values:
            raise ValueError(f"Scan frequency must be one of {allowed_values}")
        return v.lower()
    
    @validator("scan_depth")
    def validate_scan_depth(cls, v):
        if v is None:
            return v
        allowed_values = ["quick", "normal", "deep"]
        if v.lower() not in allowed_values:
            raise ValueError(f"Scan depth must be one of {allowed_values}")
        return v.lower()


class ScanResponse(ScanBase):
    """Schema for scan response with additional fields."""
    
    id: int
    status: str = Field(..., description="Status of the scan (pending, running, completed, failed)")
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Scan results summary
    vulnerabilities_count: Optional[int] = None
    critical_count: Optional[int] = None
    high_count: Optional[int] = None
    medium_count: Optional[int] = None
    low_count: Optional[int] = None
    
    class Config:
        orm_mode = True


class VulnerabilitySummary(BaseModel):
    """Schema for vulnerability summary in scan results."""
    
    id: int
    title: str
    severity: str
    cvss_score: Optional[float] = None
    cve_id: Optional[str] = None
    status: str
    priority_score: Optional[float] = None


class ScanResultResponse(BaseModel):
    """Schema for scan results."""
    
    scan_id: int
    scan_name: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Summary counts
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # Vulnerability list
    vulnerabilities: List[VulnerabilitySummary]
    
    # Raw scanner output
    raw_output: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True 