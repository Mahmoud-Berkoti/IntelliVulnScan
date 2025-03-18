import logging
from typing import Dict, List, Any, Optional

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.ml_service import train_model as train_model_service
from app.services.notification_service import send_notification

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def train_model_task(
    self,
    dataset_path: Optional[str] = None,
    model_params: Optional[Dict[str, Any]] = None,
    features: Optional[List[str]] = None,
    target: str = "priority",
) -> Dict[str, Any]:
    """
    Celery task to train the ML model in the background.
    
    Args:
        dataset_path: Path to the dataset file
        model_params: Parameters for the ML model
        features: List of feature columns to use
        target: Target column for training
        
    Returns:
        Dictionary with training results
    """
    logger.info(f"Starting model training task {self.request.id}")
    
    try:
        # Get database session
        db = SessionLocal()
        
        # Train model
        result = train_model_service(
            db=db,
            dataset_path=dataset_path,
            model_params=model_params,
            features=features,
            target=target,
        )
        
        # Close database session
        db.close()
        
        # Send notification
        if result["status"] == "success":
            send_notification(
                title="Model Training Completed",
                message=f"Model training completed successfully with accuracy {result.get('accuracy', 'N/A')}",
                notification_type="success",
            )
        else:
            send_notification(
                title="Model Training Failed",
                message=f"Model training failed: {result.get('message', 'Unknown error')}",
                notification_type="error",
            )
        
        logger.info(f"Model training task {self.request.id} completed with status {result['status']}")
        return result
    
    except Exception as e:
        logger.error(f"Error in model training task {self.request.id}: {e}", exc_info=True)
        
        # Send notification
        send_notification(
            title="Model Training Failed",
            message=f"Model training failed with exception: {str(e)}",
            notification_type="error",
        )
        
        return {
            "status": "failed",
            "message": str(e),
        }


@celery_app.task
def retrain_model() -> Dict[str, Any]:
    """
    Celery task to periodically retrain the ML model.
    
    Returns:
        Dictionary with training results
    """
    logger.info("Starting periodic model retraining")
    
    try:
        # Get database session
        db = SessionLocal()
        
        # Train model with default parameters
        result = train_model_service(db=db)
        
        # Close database session
        db.close()
        
        logger.info(f"Periodic model retraining completed with status {result['status']}")
        return result
    
    except Exception as e:
        logger.error(f"Error in periodic model retraining: {e}", exc_info=True)
        return {
            "status": "failed",
            "message": str(e),
        } 