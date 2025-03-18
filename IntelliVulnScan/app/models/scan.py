from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Scan(Base):
    """Scan model representing a vulnerability scan."""
    
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scanner_type = Column(String(50), nullable=False)  # trivy, openvas, dependency-check, custom
    
    # Target information
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    target_type = Column(String(50), nullable=False)  # container, host, application, repository
    target_identifier = Column(String(255), nullable=False)  # URL, IP, container ID, etc.
    
    # Scan configuration
    scan_frequency = Column(String(50), nullable=True)  # once, daily, weekly, monthly
    scan_depth = Column(String(50), default="normal")  # quick, normal, deep
    scanner_config = Column(JSON, nullable=True)  # Scanner-specific configuration
    
    # Scan status
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Scan results summary
    vulnerabilities_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    
    # Relationships
    asset = relationship("Asset", back_populates="scans")
    vulnerabilities = relationship("Vulnerability", back_populates="scan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Scan {self.name} ({self.scanner_type})>" 