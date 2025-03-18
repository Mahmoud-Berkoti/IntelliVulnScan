from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Body, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.ml import MLModel, MLModelCreate, MLModelUpdate, MLPrediction, MLFeatureImportance
from app.services.ml_service import (
    create_model,
    get_model,
    get_models,
    update_model,
    delete_model,
    train_model,
    predict_vulnerability_priority,
    get_feature_importance,
)

router = APIRouter()


@router.post("/models", response_model=MLModel, status_code=201)
def create_model_endpoint(
    model: MLModelCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new ML model.
    """
    return create_model(db=db, model=model)


@router.get("/models/{model_id}", response_model=MLModel)
def read_model(
    model_id: int,
    db: Session = Depends(get_db),
):
    """
    Get ML model by ID.
    """
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return db_model


@router.get("/models", response_model=List[MLModel])
def read_models(
    skip: int = 0,
    limit: int = 100,
    model_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get all ML models with optional filtering.
    """
    filters = {}
    if model_type:
        filters["model_type"] = model_type
    if status:
        filters["status"] = status
    
    return get_models(db=db, skip=skip, limit=limit, filters=filters)


@router.put("/models/{model_id}", response_model=MLModel)
def update_model_endpoint(
    model_id: int,
    model: MLModelUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an ML model.
    """
    db_model = update_model(db=db, model_id=model_id, model=model)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return db_model


@router.delete("/models/{model_id}", status_code=204)
def delete_model_endpoint(
    model_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete an ML model.
    """
    success = delete_model(db=db, model_id=model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return None


@router.post("/models/{model_id}/train", response_model=MLModel)
def train_model_endpoint(
    model_id: int,
    background_tasks: BackgroundTasks,
    training_params: Dict[str, Any] = Body({}),
    db: Session = Depends(get_db),
):
    """
    Train an ML model.
    """
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Start training in background
    background_tasks.add_task(train_model, db=db, model_id=model_id, params=training_params)
    
    # Update model status to training
    db_model = update_model(db=db, model_id=model_id, model=MLModelUpdate(status="training"))
    
    return db_model


@router.post("/predict", response_model=MLPrediction)
def predict_vulnerability_priority_endpoint(
    vulnerability_data: Dict[str, Any] = Body(...),
    model_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Predict vulnerability priority.
    """
    try:
        prediction = predict_vulnerability_priority(
            db=db, vulnerability_data=vulnerability_data, model_id=model_id
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/models/{model_id}/feature-importance", response_model=List[MLFeatureImportance])
def get_feature_importance_endpoint(
    model_id: int,
    db: Session = Depends(get_db),
):
    """
    Get feature importance for an ML model.
    """
    db_model = get_model(db=db, model_id=model_id)
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    
    feature_importance = get_feature_importance(db=db, model_id=model_id)
    if feature_importance is None:
        raise HTTPException(status_code=404, detail="Feature importance not found")
    
    return feature_importance 