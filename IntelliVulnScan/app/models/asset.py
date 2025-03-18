from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class Asset(Base):
    """Asset model representing a scannable asset."""
    
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    asset_type = Column(String(50), nullable=False)  # server, container, application, etc.
    
    # Network information
    hostname = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    
    # System information
    operating_system = Column(String(255), nullable=True)
    owner = Column(String(255), nullable=True)
    environment = Column(String(50), nullable=True)  # production, staging, development
    criticality = Column(String(50), nullable=True)  # critical, high, medium, low
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    scans = relationship("Scan", back_populates="asset", cascade="all, delete-orphan")
    vulnerabilities = relationship("Vulnerability", back_populates="asset", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Asset {self.name} ({self.asset_type})>" 