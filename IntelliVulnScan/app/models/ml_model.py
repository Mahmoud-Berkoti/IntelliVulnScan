from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class MLModel(Base):
    """SQLAlchemy model for ML models."""
    
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    model_type = Column(String, nullable=False)
    version = Column(String, nullable=True)
    features = Column(JSON, nullable=True)
    hyperparameters = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    feature_importance = Column(JSON, nullable=True)
    model_data = Column(LargeBinary, nullable=True)
    status = Column(String, nullable=False, default="created")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<MLModel(id={self.id}, name='{self.name}', model_type='{self.model_type}', status='{self.status}')>" 