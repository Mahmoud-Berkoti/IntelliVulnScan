from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ModelTrainingRequest(BaseModel):
    """Schema for requesting model training."""
    
    dataset_path: Optional[str] = Field(
        None, 
        description="Path to the dataset file. If None, will use the default dataset."
    )
    model_params: Optional[Dict[str, Any]] = Field(
        None,
        description="Parameters for the ML model. If None, will use default parameters."
    )
    features: Optional[List[str]] = Field(
        None,
        description="List of feature columns to use for training. If None, will use all available features."
    )
    target: str = Field(
        "priority",
        description="Target column for training. Default is 'priority'."
    )


class ModelTrainingResponse(BaseModel):
    """Schema for model training response."""
    
    status: str = Field(..., description="Status of the training job (started, completed, failed)")
    message: str = Field(..., description="Message about the training job")
    task_id: Optional[str] = Field(None, description="ID of the background task for tracking")


class ModelEvaluationMetrics(BaseModel):
    """Schema for model evaluation metrics."""
    
    accuracy: float = Field(..., description="Accuracy score")
    precision: float = Field(..., description="Precision score")
    recall: float = Field(..., description="Recall score")
    f1: float = Field(..., description="F1 score")
    roc_auc: Optional[float] = Field(None, description="ROC AUC score")
    confusion_matrix: List[List[int]] = Field(..., description="Confusion matrix")
    
    # Regression metrics if applicable
    mean_squared_error: Optional[float] = Field(None, description="Mean squared error")
    mean_absolute_error: Optional[float] = Field(None, description="Mean absolute error")
    r2: Optional[float] = Field(None, description="R-squared score")


class ModelEvaluationResponse(BaseModel):
    """Schema for model evaluation response."""
    
    model_name: str = Field(..., description="Name of the model")
    model_version: str = Field(..., description="Version of the model")
    training_date: str = Field(..., description="Date when the model was trained")
    metrics: ModelEvaluationMetrics = Field(..., description="Evaluation metrics")
    dataset_size: int = Field(..., description="Size of the dataset used for evaluation")
    
    # Additional information
    notes: Optional[str] = Field(None, description="Additional notes about the evaluation")


class FeatureImportance(BaseModel):
    """Schema for feature importance."""
    
    feature: str = Field(..., description="Feature name")
    importance: float = Field(..., description="Importance score")
    description: Optional[str] = Field(None, description="Description of what this feature represents")


class FeatureImportanceResponse(BaseModel):
    """Schema for feature importance response."""
    
    model_name: str = Field(..., description="Name of the model")
    model_version: str = Field(..., description="Version of the model")
    features: List[FeatureImportance] = Field(..., description="List of features and their importance")
    
    # Additional information
    threshold: Optional[float] = Field(None, description="Threshold used for feature selection")
    notes: Optional[str] = Field(None, description="Additional notes about feature importance")


class PredictionRequest(BaseModel):
    """Schema for prediction request."""
    
    vulnerability_data: Dict[str, Any] = Field(
        ...,
        description="Vulnerability data for prediction. Should include all required features."
    )


class PredictionResponse(BaseModel):
    """Schema for prediction response."""
    
    vulnerability_id: Optional[int] = Field(None, description="ID of the vulnerability if available")
    priority_score: float = Field(..., description="Predicted priority score", ge=0.0, le=1.0)
    priority_class: str = Field(..., description="Priority class (critical, high, medium, low)")
    confidence: float = Field(..., description="Confidence of the prediction", ge=0.0, le=1.0)
    
    # Feature contributions
    feature_contributions: Dict[str, float] = Field(
        ...,
        description="Contribution of each feature to the prediction"
    )
    
    # Explanation
    explanation: str = Field(..., description="Human-readable explanation of the prediction")
    recommended_action: str = Field(..., description="Recommended action based on the prediction") 