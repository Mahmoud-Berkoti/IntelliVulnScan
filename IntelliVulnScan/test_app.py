import logging
import os
import sys
import json
from datetime import datetime

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.database import Base
from app.models.asset import Asset
from app.models.scan import Scan
from app.models.vulnerability import Vulnerability
from app.models.ml_model import MLModel
from app.services.asset_service import create_asset
from app.services.scan_service import create_scan, start_scan
from app.services.ml_service import create_model, train_model, predict_vulnerability_priority
from app.schemas.asset import AssetCreate
from app.schemas.scan import ScanCreate
from app.schemas.ml import MLModelCreate
from app.tasks.scan_tasks import run_scan_task

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def setup_test_db():
    """Set up a test database."""
    # Create a test database URL
    test_db_url = "sqlite:///./test.db"
    
    # Create engine and session
    engine = create_engine(test_db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    return engine, SessionLocal()


def test_asset_creation(db):
    """Test asset creation."""
    logger.info("Testing asset creation...")
    
    # Create a test asset
    asset = AssetCreate(
        name="Test Server",
        description="A test server for vulnerability scanning",
        asset_type="server",
        hostname="test-server",
        ip_address="192.168.1.100",
        operating_system="Ubuntu 20.04",
        owner="Test Team",
        environment="development",
        criticality="medium",
    )
    
    # Create the asset
    db_asset = create_asset(db=db, asset=asset)
    
    logger.info(f"Created asset: {db_asset.name} (ID: {db_asset.id})")
    
    return db_asset


def test_scan_creation(db, asset_id):
    """Test scan creation."""
    logger.info("Testing scan creation...")
    
    # Create a test scan
    scan = ScanCreate(
        name="Test Scan",
        description="A test vulnerability scan",
        scanner_type="trivy",
        asset_id=asset_id,
        target_type="container",
        target_identifier="ubuntu:20.04",
        scan_frequency="daily",
        scan_depth="full",
        scanner_config={
            "severity": "CRITICAL,HIGH",
            "output_format": "json",
        },
    )
    
    # Create the scan
    db_scan = create_scan(db=db, scan=scan)
    
    logger.info(f"Created scan: {db_scan.name} (ID: {db_scan.id})")
    
    return db_scan


def test_scan_execution(db, scan_id):
    """Test scan execution."""
    logger.info("Testing scan execution...")
    
    # Start the scan
    db_scan = start_scan(db=db, scan_id=scan_id)
    
    logger.info(f"Started scan: {db_scan.name} (ID: {db_scan.id})")
    
    # Run the scan task
    try:
        # In a real application, this would be executed by Celery
        # For testing, we'll run it directly
        run_scan_task(scan_id)
        logger.info("Scan task completed successfully")
    except Exception as e:
        logger.error(f"Error running scan task: {str(e)}")
    
    return db_scan


def test_ml_model_creation(db):
    """Test ML model creation."""
    logger.info("Testing ML model creation...")
    
    # Create a test ML model
    model = MLModelCreate(
        name="Test Model",
        description="A test ML model for vulnerability prioritization",
        model_type="gradient_boosting",
        features=[
            "cvss_score",
            "exploit_available",
            "patch_available",
            "severity",
            "business_impact",
        ],
        hyperparameters={
            "n_estimators": 100,
            "learning_rate": 0.1,
            "max_depth": 3,
        },
    )
    
    # Create the model
    db_model = create_model(db=db, model=model)
    
    logger.info(f"Created ML model: {db_model.name} (ID: {db_model.id})")
    
    return db_model


def test_ml_model_training(db, model_id):
    """Test ML model training."""
    logger.info("Testing ML model training...")
    
    # Train the model
    try:
        # In a real application, this would be executed by Celery
        # For testing, we'll run it directly
        db_model = train_model(
            db=db,
            model_id=model_id,
            params={
                "hyperparameters": {
                    "n_estimators": 100,
                    "learning_rate": 0.1,
                    "max_depth": 3,
                },
            },
        )
        
        if db_model:
            logger.info(f"Trained ML model: {db_model.name} (ID: {db_model.id})")
            logger.info(f"Model metrics: {db_model.metrics}")
        else:
            logger.error("Error training ML model")
    except Exception as e:
        logger.error(f"Error training ML model: {str(e)}")
    
    return db_model


def test_vulnerability_prediction(db, model_id):
    """Test vulnerability prediction."""
    logger.info("Testing vulnerability prediction...")
    
    # Create a test vulnerability
    vulnerability_data = {
        "title": "Test Vulnerability",
        "description": "A test vulnerability for prediction",
        "cve_id": "CVE-2023-12345",
        "severity": "high",
        "cvss_score": 8.5,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "exploit_available": True,
        "exploit_maturity": "functional",
        "patch_available": False,
        "affected_component": "test-component",
        "affected_version": "1.0.0",
        "business_impact": "high",
        "data_classification": "confidential",
        "system_exposure": "internet",
    }
    
    # Predict vulnerability priority
    try:
        prediction = predict_vulnerability_priority(
            db=db,
            vulnerability_data=vulnerability_data,
            model_id=model_id,
        )
        
        logger.info(f"Predicted priority score: {prediction.priority_score}")
        logger.info(f"Prediction explanation: {prediction.explanation}")
    except Exception as e:
        logger.error(f"Error predicting vulnerability priority: {str(e)}")


def main():
    """Run the test script."""
    logger.info("Starting test script...")
    
    # Set up test database
    engine, db = setup_test_db()
    
    try:
        # Test asset creation
        asset = test_asset_creation(db)
        
        # Test scan creation
        scan = test_scan_creation(db, asset.id)
        
        # Test scan execution
        test_scan_execution(db, scan.id)
        
        # Test ML model creation
        model = test_ml_model_creation(db)
        
        # Test ML model training
        trained_model = test_ml_model_training(db, model.id)
        
        # Test vulnerability prediction
        if trained_model and trained_model.status == "trained":
            test_vulnerability_prediction(db, trained_model.id)
    
    except Exception as e:
        logger.error(f"Error running test script: {str(e)}")
    
    finally:
        # Close database session
        db.close()
        
        # Drop tables
        Base.metadata.drop_all(bind=engine)
    
    logger.info("Test script completed")


if __name__ == "__main__":
    main() 