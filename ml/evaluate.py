"""
SafePath ML Evaluation & Prediction Utility
Loads trained TF-IDF and Logistic Regression models,
evaluates arbitrary input texts or test batches, and returns probabilities.
"""

import os
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")
VEC_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")
MODEL_PATH = os.path.join(MODEL_DIR, "incident_classifier.joblib")

_vectorizer = None
_model = None

def get_model():
    global _vectorizer, _model
    if _vectorizer is None or _model is None:
        if not os.path.exists(VEC_PATH) or not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("Model artifacts missing. Run ml/train.py first.")
        _vectorizer = joblib.load(VEC_PATH)
        _model = joblib.load(MODEL_PATH)
    return _vectorizer, _model

def classify_description(text: str, confidence_threshold: float = 0.35):
    """
    Classifies a text description into one of the 6 incident types
    along with a confidence score.
    """
    if not text or not str(text).strip():
        return {
            "incidentType": "Other",
            "confidence": 0.0,
            "isLowConfidence": True,
            "probabilities": {}
        }
    
    vec, model = get_model()
    cleaned_text = str(text).strip()
    x_vec = vec.transform([cleaned_text])
    
    probs = model.predict_proba(x_vec)[0]
    classes = model.classes_
    
    top_idx = int(np.argmax(probs))
    top_class = str(classes[top_idx])
    confidence = float(probs[top_idx])
    
    is_low_confidence = confidence < confidence_threshold
    
    class_probs = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}
    
    return {
        "incidentType": top_class,
        "confidence": round(confidence, 4),
        "isLowConfidence": is_low_confidence,
        "probabilities": class_probs
    }

if __name__ == "__main__":
    sample_texts = [
        "Someone grabbed my phone from my hand and ran away",
        "Pointed a knife at me and demanded my money and jewelry",
        "Followed me down the street shouting vulgar catcalls and threatening gestures",
        "Got punched in the face by two aggressive individuals and pushed to the ground",
        "Masked men loitering around the house gate checking locks with flashlights",
        "Street light not working and large puddle on the pavement"
    ]
    
    print("Evaluating sample descriptions:\n")
    for text in sample_texts:
        result = classify_description(text)
        print(f"Text: '{text}'")
        print(f" -> Predicted: {result['incidentType']} (Confidence: {result['confidence'] * 100:.1f}%)")
        print(f" -> Low confidence flag: {result['isLowConfidence']}")
        print()
