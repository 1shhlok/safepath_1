"""
SafePath ML Microservice
Flask HTTP service exposing POST /predict and GET /health
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from evaluate import classify_description, get_model
import train

app = Flask(__name__)
CORS(app)

CONFIDENCE_THRESHOLD = float(os.environ.get("ML_CONFIDENCE_THRESHOLD", "0.35"))
PORT = int(os.environ.get("ML_PORT", "5001"))

# Ensure model artifacts exist on startup
try:
    get_model()
    print("SafePath ML model loaded successfully.")
except Exception as e:
    print(f"Model artifacts not found or failed to load: {e}. Running training now...")
    train.train_and_evaluate()
    get_model()
    print("SafePath ML model trained and loaded successfully.")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "safepath-ml-service",
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }), 200

@app.route('/predict', methods=['POST'])
def predict_incident():
    data = request.get_json(silent=True)
    if not data or 'description' not in data:
        return jsonify({
            "error": "Missing 'description' in request body"
        }), 400
    
    description = str(data['description']).strip()
    if not description:
        return jsonify({
            "error": "Description cannot be empty"
        }), 400
    
    try:
        result = classify_description(description, confidence_threshold=CONFIDENCE_THRESHOLD)
        return jsonify({
            "incidentType": result["incidentType"],
            "confidence": result["confidence"],
            "isLowConfidence": result["isLowConfidence"],
            "probabilities": result["probabilities"]
        }), 200
    except Exception as e:
        app.logger.error(f"Prediction failed: {str(e)}")
        return jsonify({
            "error": "Internal error during incident classification"
        }), 500

if __name__ == '__main__':
    print(f"Starting SafePath ML Service on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=False)
