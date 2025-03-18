import logging
import os
import json
import pickle
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_squared_error, mean_absolute_error, r2_score
)
import joblib
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.vulnerability import Vulnerability
from app.models.ml_model import MLModel
from app.schemas.ml import MLModelCreate, MLModelUpdate, MLPrediction, MLFeatureImportance

logger = logging.getLogger(__name__)


def load_model():
    """Load the trained ML model."""
    model_path = settings.MODEL_PATH
    if not os.path.exists(model_path):
        logger.warning(f"Model not found at {model_path}")
        return None
    
    try:
        model = joblib.load(model_path)
        logger.info(f"Model loaded from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return None


def load_model_metadata():
    """Load model metadata."""
    metadata_path = os.path.splitext(settings.MODEL_PATH)[0] + "_metadata.json"
    if not os.path.exists(metadata_path):
        logger.warning(f"Model metadata not found at {metadata_path}")
        return {}
    
    try:
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        return metadata
    except Exception as e:
        logger.error(f"Error loading model metadata: {e}")
        return {}


def preprocess_data(data: pd.DataFrame) -> Tuple[pd.DataFrame, Optional[StandardScaler]]:
    """
    Preprocess data for model training or prediction.
    
    Args:
        data: DataFrame with vulnerability data
        
    Returns:
        Tuple of preprocessed data and scaler
    """
    # Handle missing values
    data = data.fillna({
        'cvss_score': 0.0,
        'exploit_available': False,
        'patch_available': False,
    })
    
    # Convert categorical variables to one-hot encoding
    categorical_cols = ['severity', 'business_impact', 'data_classification', 'system_exposure']
    data_encoded = pd.get_dummies(data, columns=categorical_cols, drop_first=False)
    
    # Scale numerical features
    numerical_cols = ['cvss_score']
    if numerical_cols:
        scaler = StandardScaler()
        data_encoded[numerical_cols] = scaler.fit_transform(data_encoded[numerical_cols])
    else:
        scaler = None
    
    return data_encoded, scaler


def train_model(
    db: Session,
    dataset_path: Optional[str] = None,
    model_params: Optional[Dict[str, Any]] = None,
    features: Optional[List[str]] = None,
    target: str = "priority",
) -> Dict[str, Any]:
    """
    Train a machine learning model for vulnerability prioritization.
    
    Args:
        db: Database session
        dataset_path: Path to the dataset file
        model_params: Parameters for the ML model
        features: List of feature columns to use
        target: Target column for training
        
    Returns:
        Dictionary with training results
    """
    try:
        # Load data
        if dataset_path and os.path.exists(dataset_path):
            data = pd.read_csv(dataset_path)
            logger.info(f"Loaded data from {dataset_path}")
        else:
            # If no dataset provided, use vulnerabilities from the database
            vulnerabilities = db.query(Vulnerability).all()
            if not vulnerabilities:
                logger.error("No vulnerabilities found in the database")
                return {"status": "failed", "message": "No vulnerabilities found in the database"}
            
            data = pd.DataFrame([v.__dict__ for v in vulnerabilities])
            logger.info(f"Loaded {len(data)} vulnerabilities from the database")
        
        # Preprocess data
        data_processed, scaler = preprocess_data(data)
        
        # Select features
        if features:
            X = data_processed[features]
        else:
            # Exclude non-feature columns
            exclude_cols = [target, 'id', 'created_at', 'updated_at', 'title', 'description', 'cve_id']
            X = data_processed.drop(columns=[col for col in exclude_cols if col in data_processed.columns])
        
        y = data_processed[target]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Set default model parameters if not provided
        if not model_params:
            model_params = {
                'n_estimators': 100,
                'max_depth': 10,
                'random_state': 42,
            }
        
        # Train model
        model = GradientBoostingClassifier(**model_params)
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model
        os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)
        joblib.dump(model, settings.MODEL_PATH)
        
        # Save feature names
        feature_names = X.columns.tolist()
        
        # Save scaler if used
        if scaler:
            scaler_path = os.path.splitext(settings.MODEL_PATH)[0] + "_scaler.pkl"
            with open(scaler_path, "wb") as f:
                pickle.dump(scaler, f)
        
        # Save metadata
        metadata = {
            "model_name": "GradientBoostingClassifier",
            "model_version": "1.0",
            "training_date": datetime.now().isoformat(),
            "accuracy": accuracy,
            "feature_names": feature_names,
            "model_params": model_params,
            "dataset_size": len(data),
            "training_size": len(X_train),
            "test_size": len(X_test),
        }
        
        metadata_path = os.path.splitext(settings.MODEL_PATH)[0] + "_metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Model trained and saved to {settings.MODEL_PATH}")
        return {
            "status": "success",
            "message": f"Model trained with accuracy {accuracy:.4f}",
            "accuracy": accuracy,
            "model_path": settings.MODEL_PATH,
        }
    
    except Exception as e:
        logger.error(f"Error training model: {e}", exc_info=True)
        return {"status": "failed", "message": str(e)}


def evaluate_model(db: Session) -> Optional[Dict[str, Any]]:
    """
    Evaluate the current ML model and return performance metrics.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with evaluation metrics
    """
    model = load_model()
    if not model:
        return None
    
    metadata = load_model_metadata()
    
    try:
        # Load test data
        vulnerabilities = db.query(Vulnerability).all()
        if not vulnerabilities:
            logger.error("No vulnerabilities found in the database")
            return None
        
        data = pd.DataFrame([v.__dict__ for v in vulnerabilities])
        
        # Preprocess data
        data_processed, _ = preprocess_data(data)
        
        # Get feature names from metadata
        feature_names = metadata.get("feature_names", [])
        if not feature_names:
            logger.error("No feature names found in metadata")
            return None
        
        # Select features
        X = data_processed[feature_names]
        y = data_processed["priority"]
        
        # Make predictions
        y_pred = model.predict(X)
        y_pred_proba = model.predict_proba(X)[:, 1]
        
        # Calculate metrics
        metrics = {
            "accuracy": accuracy_score(y, y_pred),
            "precision": precision_score(y, y_pred, average="weighted"),
            "recall": recall_score(y, y_pred, average="weighted"),
            "f1": f1_score(y, y_pred, average="weighted"),
            "confusion_matrix": confusion_matrix(y, y_pred).tolist(),
        }
        
        # Add ROC AUC if binary classification
        if len(np.unique(y)) == 2:
            metrics["roc_auc"] = roc_auc_score(y, y_pred_proba)
        
        return {
            "model_name": metadata.get("model_name", "Unknown"),
            "model_version": metadata.get("model_version", "Unknown"),
            "training_date": metadata.get("training_date", "Unknown"),
            "metrics": metrics,
            "dataset_size": len(data),
        }
    
    except Exception as e:
        logger.error(f"Error evaluating model: {e}", exc_info=True)
        return None


def get_feature_importance(db: Session) -> Optional[Dict[str, Any]]:
    """
    Get feature importance from the current ML model.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with feature importance
    """
    model = load_model()
    if not model:
        return None
    
    metadata = load_model_metadata()
    
    try:
        # Get feature names from metadata
        feature_names = metadata.get("feature_names", [])
        if not feature_names:
            logger.error("No feature names found in metadata")
            return None
        
        # Get feature importance
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        else:
            logger.error("Model does not have feature importances")
            return None
        
        # Create feature importance list
        features = []
        for name, importance in zip(feature_names, importances):
            if importance >= settings.FEATURE_IMPORTANCE_THRESHOLD:
                features.append({
                    "feature": name,
                    "importance": float(importance),
                    "description": get_feature_description(name),
                })
        
        # Sort by importance
        features.sort(key=lambda x: x["importance"], reverse=True)
        
        return {
            "model_name": metadata.get("model_name", "Unknown"),
            "model_version": metadata.get("model_version", "Unknown"),
            "features": features,
            "threshold": settings.FEATURE_IMPORTANCE_THRESHOLD,
        }
    
    except Exception as e:
        logger.error(f"Error getting feature importance: {e}", exc_info=True)
        return None


def predict_vulnerability_priority(
    db: Session,
    vulnerability_data: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Make a prediction for a single vulnerability using the trained model.
    
    Args:
        db: Database session
        vulnerability_data: Dictionary with vulnerability data
        
    Returns:
        Dictionary with prediction results
    """
    model = load_model()
    if not model:
        return None
    
    metadata = load_model_metadata()
    
    try:
        # Convert to DataFrame
        data = pd.DataFrame([vulnerability_data])
        
        # Preprocess data
        data_processed, _ = preprocess_data(data)
        
        # Get feature names from metadata
        feature_names = metadata.get("feature_names", [])
        if not feature_names:
            logger.error("No feature names found in metadata")
            return None
        
        # Select features
        X = data_processed[feature_names]
        
        # Make prediction
        priority_score = float(model.predict_proba(X)[0, 1])
        priority_class = get_priority_class(priority_score)
        
        # Get feature contributions
        feature_contributions = {}
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            for name, importance in zip(feature_names, importances):
                feature_value = X[name].values[0]
                contribution = float(importance * feature_value)
                feature_contributions[name] = contribution
        
        # Generate explanation
        explanation = generate_explanation(priority_score, feature_contributions, vulnerability_data)
        
        # Generate recommended action
        recommended_action = generate_recommended_action(priority_score, vulnerability_data)
        
        return {
            "vulnerability_id": vulnerability_data.get("id"),
            "priority_score": priority_score,
            "priority_class": priority_class,
            "confidence": get_confidence(priority_score),
            "feature_contributions": feature_contributions,
            "explanation": explanation,
            "recommended_action": recommended_action,
        }
    
    except Exception as e:
        logger.error(f"Error predicting vulnerability priority: {e}", exc_info=True)
        return None


def get_model_metadata(db: Session) -> Optional[Dict[str, Any]]:
    """
    Get metadata about the current ML model.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with model metadata
    """
    return load_model_metadata()


# Helper functions

def get_feature_description(feature_name: str) -> str:
    """Get description for a feature."""
    descriptions = {
        "cvss_score": "CVSS score indicating the severity of the vulnerability",
        "exploit_available": "Whether an exploit is publicly available",
        "patch_available": "Whether a patch is available for the vulnerability",
        "severity_critical": "Vulnerability has critical severity",
        "severity_high": "Vulnerability has high severity",
        "severity_medium": "Vulnerability has medium severity",
        "severity_low": "Vulnerability has low severity",
        "business_impact_critical": "Vulnerability has critical business impact",
        "business_impact_high": "Vulnerability has high business impact",
        "business_impact_medium": "Vulnerability has medium business impact",
        "business_impact_low": "Vulnerability has low business impact",
        "system_exposure_internet-facing": "Affected system is exposed to the internet",
        "system_exposure_internal": "Affected system is internal",
        "system_exposure_isolated": "Affected system is isolated",
    }
    return descriptions.get(feature_name, "")


def get_priority_class(score: float) -> str:
    """Convert priority score to class."""
    if score >= 0.8:
        return "critical"
    elif score >= 0.6:
        return "high"
    elif score >= 0.4:
        return "medium"
    else:
        return "low"


def get_confidence(score: float) -> float:
    """Calculate confidence based on how far the score is from 0.5."""
    return min(1.0, max(0.0, abs(score - 0.5) * 2))


def generate_explanation(
    priority_score: float,
    feature_contributions: Dict[str, float],
    vulnerability_data: Dict[str, Any],
) -> str:
    """Generate human-readable explanation for the prediction."""
    priority_class = get_priority_class(priority_score)
    
    # Sort features by contribution
    sorted_features = sorted(
        feature_contributions.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:3]  # Top 3 features
    
    explanation = f"This vulnerability has been classified as {priority_class} priority "
    explanation += f"with a score of {priority_score:.2f}. "
    
    if sorted_features:
        explanation += "The main factors contributing to this classification are: "
        feature_explanations = []
        
        for feature, contribution in sorted_features:
            if "cvss_score" in feature and contribution > 0:
                feature_explanations.append(f"high CVSS score ({vulnerability_data.get('cvss_score', 'N/A')})")
            elif "exploit_available" in feature and contribution > 0:
                feature_explanations.append("publicly available exploit")
            elif "patch_available" in feature and contribution < 0:
                feature_explanations.append("available patch")
            elif "severity" in feature and contribution > 0:
                severity = feature.split("_")[1]
                feature_explanations.append(f"{severity} severity")
            elif "business_impact" in feature and contribution > 0:
                impact = feature.split("_")[2]
                feature_explanations.append(f"{impact} business impact")
            elif "system_exposure" in feature and contribution > 0:
                exposure = feature.split("_")[2]
                feature_explanations.append(f"{exposure} system exposure")
        
        explanation += ", ".join(feature_explanations)
    
    return explanation


def generate_recommended_action(
    priority_score: float,
    vulnerability_data: Dict[str, Any],
) -> str:
    """Generate recommended action based on the prediction."""
    priority_class = get_priority_class(priority_score)
    
    if priority_class == "critical":
        return "Immediate remediation required. Create high-priority ticket and patch within 24 hours."
    elif priority_class == "high":
        return "Remediate within 7 days. Create ticket and schedule patching."
    elif priority_class == "medium":
        return "Remediate within 30 days. Include in next patch cycle."
    else:
        return "Remediate as part of regular maintenance. No immediate action required."


def create_model(db: Session, model: MLModelCreate) -> MLModel:
    """
    Create a new ML model.
    
    Args:
        db: Database session
        model: Model data
        
    Returns:
        Created model
    """
    db_model = MLModel(
        name=model.name,
        description=model.description,
        model_type=model.model_type,
        features=model.features,
        hyperparameters=model.hyperparameters,
        metrics={},
        status="created",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    logger.info(f"Created ML model with ID {db_model.id}")
    return db_model


def get_model(db: Session, model_id: int) -> Optional[MLModel]:
    """
    Get an ML model by ID.
    
    Args:
        db: Database session
        model_id: ID of the model
        
    Returns:
        Model if found, None otherwise
    """
    return db.query(MLModel).filter(MLModel.id == model_id).first()


def get_models(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None,
) -> List[MLModel]:
    """
    Get ML models with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        filters: Optional filters
        
    Returns:
        List of models
    """
    query = db.query(MLModel)
    
    if filters:
        if "model_type" in filters:
            query = query.filter(MLModel.model_type == filters["model_type"])
        if "status" in filters:
            query = query.filter(MLModel.status == filters["status"])
    
    return query.offset(skip).limit(limit).all()


def update_model(db: Session, model_id: int, model: MLModelUpdate) -> Optional[MLModel]:
    """
    Update an ML model.
    
    Args:
        db: Database session
        model_id: ID of the model to update
        model: Updated model data
        
    Returns:
        Updated model if found, None otherwise
    """
    db_model = get_model(db, model_id)
    if not db_model:
        return None
    
    # Update fields
    for field, value in model.dict(exclude_unset=True).items():
        setattr(db_model, field, value)
    
    db_model.updated_at = datetime.now()
    db.commit()
    db.refresh(db_model)
    logger.info(f"Updated ML model with ID {db_model.id}")
    return db_model


def delete_model(db: Session, model_id: int) -> bool:
    """
    Delete an ML model.
    
    Args:
        db: Database session
        model_id: ID of the model to delete
        
    Returns:
        True if deleted, False otherwise
    """
    db_model = get_model(db, model_id)
    if not db_model:
        return False
    
    db.delete(db_model)
    db.commit()
    logger.info(f"Deleted ML model with ID {model_id}")
    return True


def _get_vulnerability_features(vulnerability_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract features from vulnerability data.
    
    Args:
        vulnerability_data: Vulnerability data
        
    Returns:
        Features dictionary
    """
    # Extract features from vulnerability data
    features = {
        "cvss_score": vulnerability_data.get("cvss_score", 0.0),
        "exploit_available": int(vulnerability_data.get("exploit_available", False)),
        "patch_available": int(vulnerability_data.get("patch_available", False)),
    }
    
    # Add severity as one-hot encoded features
    severity = vulnerability_data.get("severity", "low").lower()
    features["severity_critical"] = int(severity == "critical")
    features["severity_high"] = int(severity == "high")
    features["severity_medium"] = int(severity == "medium")
    features["severity_low"] = int(severity == "low")
    
    # Add exploit maturity as one-hot encoded features
    exploit_maturity = vulnerability_data.get("exploit_maturity", "").lower()
    features["exploit_maturity_high"] = int(exploit_maturity == "high")
    features["exploit_maturity_functional"] = int(exploit_maturity == "functional")
    features["exploit_maturity_poc"] = int(exploit_maturity == "poc")
    features["exploit_maturity_unproven"] = int(exploit_maturity == "unproven")
    
    # Add business impact as one-hot encoded features
    business_impact = vulnerability_data.get("business_impact", "").lower()
    features["business_impact_critical"] = int(business_impact == "critical")
    features["business_impact_high"] = int(business_impact == "high")
    features["business_impact_medium"] = int(business_impact == "medium")
    features["business_impact_low"] = int(business_impact == "low")
    
    # Add data classification as one-hot encoded features
    data_classification = vulnerability_data.get("data_classification", "").lower()
    features["data_classification_restricted"] = int(data_classification == "restricted")
    features["data_classification_confidential"] = int(data_classification == "confidential")
    features["data_classification_internal"] = int(data_classification == "internal")
    features["data_classification_public"] = int(data_classification == "public")
    
    # Add system exposure as one-hot encoded features
    system_exposure = vulnerability_data.get("system_exposure", "").lower()
    features["system_exposure_internet"] = int(system_exposure == "internet")
    features["system_exposure_intranet"] = int(system_exposure == "intranet")
    features["system_exposure_internal"] = int(system_exposure == "internal")
    features["system_exposure_isolated"] = int(system_exposure == "isolated")
    
    return features


def _get_latest_model(db: Session, model_id: Optional[int] = None) -> Optional[MLModel]:
    """
    Get the latest trained model.
    
    Args:
        db: Database session
        model_id: Optional model ID
        
    Returns:
        Latest trained model if found, None otherwise
    """
    if model_id:
        model = get_model(db, model_id)
        if model and model.status == "trained" and model.model_data:
            return model
    
    # Get the latest trained model
    models = (
        db.query(MLModel)
        .filter(MLModel.status == "trained")
        .filter(MLModel.model_data.isnot(None))
        .order_by(MLModel.updated_at.desc())
        .limit(1)
        .all()
    )
    
    if models:
        return models[0]
    
    return None


def train_model(db: Session, model_id: int, params: Dict[str, Any]) -> Optional[MLModel]:
    """
    Train an ML model.
    
    Args:
        db: Database session
        model_id: ID of the model to train
        params: Training parameters
        
    Returns:
        Trained model if successful, None otherwise
    """
    db_model = get_model(db, model_id)
    if not db_model:
        logger.error(f"Model with ID {model_id} not found")
        return None
    
    try:
        # Update model status to training
        db_model.status = "training"
        db_model.updated_at = datetime.now()
        db.commit()
        db.refresh(db_model)
        
        # Get training data
        # In a real implementation, this would fetch data from the database
        # For this example, we'll generate synthetic data
        X, y = _generate_synthetic_training_data()
        
        # Split data into train and test sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Get hyperparameters
        hyperparameters = db_model.hyperparameters or {}
        hyperparameters.update(params.get("hyperparameters", {}))
        
        # Train model
        model = GradientBoostingClassifier(
            n_estimators=hyperparameters.get("n_estimators", 100),
            learning_rate=hyperparameters.get("learning_rate", 0.1),
            max_depth=hyperparameters.get("max_depth", 3),
            random_state=42,
        )
        model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = model.predict(X_test)
        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, average="weighted")),
            "recall": float(recall_score(y_test, y_pred, average="weighted")),
            "f1": float(f1_score(y_test, y_pred, average="weighted")),
        }
        
        # Get feature importance
        feature_importance = []
        for i, importance in enumerate(model.feature_importances_):
            feature_importance.append({
                "feature": f"feature_{i}",
                "importance": float(importance),
            })
        
        # Serialize model
        model_data = pickle.dumps(model)
        
        # Update model
        db_model.hyperparameters = hyperparameters
        db_model.metrics = metrics
        db_model.feature_importance = feature_importance
        db_model.model_data = model_data
        db_model.status = "trained"
        db_model.updated_at = datetime.now()
        db.commit()
        db.refresh(db_model)
        
        logger.info(f"Trained ML model with ID {db_model.id}")
        return db_model
    
    except Exception as e:
        logger.error(f"Error training model with ID {model_id}: {str(e)}")
        
        # Update model status to error
        db_model.status = "error"
        db_model.updated_at = datetime.now()
        db.commit()
        db.refresh(db_model)
        
        return None


def _generate_synthetic_training_data() -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training data.
    
    Returns:
        Tuple of features and labels
    """
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 1000
    n_features = 25
    
    # Generate features
    X = np.random.rand(n_samples, n_features)
    
    # Generate labels (priority scores from 0 to 10)
    y = np.zeros(n_samples)
    
    # CVSS score has high impact on priority
    cvss_score = X[:, 0] * 10  # Scale to 0-10
    
    # Exploit availability has high impact
    exploit_available = (X[:, 1] > 0.7).astype(int)
    
    # Patch availability has medium impact (inverse relationship)
    patch_available = (X[:, 2] > 0.5).astype(int)
    
    # Severity has high impact
    severity_critical = (X[:, 3] > 0.8).astype(int)
    severity_high = ((X[:, 3] > 0.6) & (X[:, 3] <= 0.8)).astype(int)
    
    # Business impact has medium impact
    business_impact_critical = (X[:, 4] > 0.8).astype(int)
    business_impact_high = ((X[:, 4] > 0.6) & (X[:, 4] <= 0.8)).astype(int)
    
    # Calculate priority score
    y = (
        cvss_score * 0.4 +  # 40% weight
        exploit_available * 2.0 +  # +2 if exploit available
        (1 - patch_available) * 1.5 +  # +1.5 if no patch
        severity_critical * 2.5 +  # +2.5 if critical
        severity_high * 1.5 +  # +1.5 if high
        business_impact_critical * 2.0 +  # +2 if critical business impact
        business_impact_high * 1.0  # +1 if high business impact
    )
    
    # Normalize to 0-10 range
    y = np.clip(y, 0, 10)
    
    return X, y


def predict_vulnerability_priority(
    db: Session, vulnerability_data: Dict[str, Any], model_id: Optional[int] = None
) -> MLPrediction:
    """
    Predict vulnerability priority.
    
    Args:
        db: Database session
        vulnerability_data: Vulnerability data
        model_id: Optional model ID
        
    Returns:
        Prediction result
    """
    # Get the latest trained model
    db_model = _get_latest_model(db, model_id)
    if not db_model:
        raise ValueError("No trained model found")
    
    try:
        # Extract features
        features = _get_vulnerability_features(vulnerability_data)
        
        # Convert features to numpy array
        feature_names = list(features.keys())
        X = np.array([features[name] for name in feature_names]).reshape(1, -1)
        
        # Load model
        model = pickle.loads(db_model.model_data)
        
        # Make prediction
        priority_score = float(model.predict(X)[0])
        
        # Get feature importance for this prediction
        explanation = {}
        if hasattr(model, "feature_importances_"):
            for i, name in enumerate(feature_names):
                explanation[name] = float(model.feature_importances_[i])
        
        # Create prediction result
        prediction = MLPrediction(
            priority_score=priority_score,
            model_id=db_model.id,
            model_name=db_model.name,
            model_version=db_model.version,
            explanation=explanation,
            timestamp=datetime.now(),
        )
        
        return prediction
    
    except Exception as e:
        logger.error(f"Error predicting vulnerability priority: {str(e)}")
        raise ValueError(f"Error predicting vulnerability priority: {str(e)}")


def get_feature_importance(db: Session, model_id: int) -> Optional[List[MLFeatureImportance]]:
    """
    Get feature importance for an ML model.
    
    Args:
        db: Database session
        model_id: ID of the model
        
    Returns:
        Feature importance if found, None otherwise
    """
    db_model = get_model(db, model_id)
    if not db_model or not db_model.feature_importance:
        return None
    
    feature_importance = []
    for item in db_model.feature_importance:
        feature_importance.append(MLFeatureImportance(
            feature=item["feature"],
            importance=item["importance"],
        ))
    
    return feature_importance 