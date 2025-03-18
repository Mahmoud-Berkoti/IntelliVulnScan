from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class AssetBase(BaseModel):
    """Base schema for asset data."""
    name: str = Field(..., description="Name of the asset")
    description: Optional[str] = Field(None, description="Description of the asset")
    asset_type: str = Field(..., description="Type of asset (e.g., server, container, application)")
    hostname: Optional[str] = Field(None, description="Hostname of the asset")
    ip_address: Optional[str] = Field(None, description="IP address of the asset")
    operating_system: Optional[str] = Field(None, description="Operating system of the asset")
    owner: Optional[str] = Field(None, description="Owner of the asset")
    environment: str = Field(..., description="Environment (e.g., production, staging, development)")
    criticality: str = Field(..., description="Criticality level (e.g., critical, high, medium, low)")


class AssetCreate(AssetBase):
    """Schema for creating a new asset."""
    pass


class AssetUpdate(BaseModel):
    """Schema for updating an asset."""
    name: Optional[str] = Field(None, description="Name of the asset")
    description: Optional[str] = Field(None, description="Description of the asset")
    asset_type: Optional[str] = Field(None, description="Type of asset (e.g., server, container, application)")
    hostname: Optional[str] = Field(None, description="Hostname of the asset")
    ip_address: Optional[str] = Field(None, description="IP address of the asset")
    operating_system: Optional[str] = Field(None, description="Operating system of the asset")
    owner: Optional[str] = Field(None, description="Owner of the asset")
    environment: Optional[str] = Field(None, description="Environment (e.g., production, staging, development)")
    criticality: Optional[str] = Field(None, description="Criticality level (e.g., critical, high, medium, low)")


class AssetInDB(AssetBase):
    """Schema for asset data from the database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Asset(AssetInDB):
    """Schema for asset data with relationships."""
    vulnerabilities_count: Optional[int] = Field(0, description="Count of vulnerabilities for this asset")
    critical_count: Optional[int] = Field(0, description="Count of critical vulnerabilities")
    high_count: Optional[int] = Field(0, description="Count of high vulnerabilities")
    medium_count: Optional[int] = Field(0, description="Count of medium vulnerabilities")
    low_count: Optional[int] = Field(0, description="Count of low vulnerabilities")
    risk_score: Optional[float] = Field(0.0, description="Risk score for this asset")
    last_scan_date: Optional[datetime] = Field(None, description="Date of the last scan")

    class Config:
        orm_mode = True


class AssetVulnerabilitySummary(BaseModel):
    """Schema for asset vulnerability summary."""
    asset_id: int
    asset_name: str
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    open_count: int
    closed_count: int
    risk_score: float
    last_scan: Optional[dict] = None 