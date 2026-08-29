"""
SafePath ML Training Pipeline
Trains TF-IDF + Logistic Regression on synthetic Nagpur incident descriptions.
Calculates evaluation metrics (accuracy, precision, recall, F1, confusion matrix)
and serializes artifacts to ml/model/.
"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

SUPPORTED_CLASSES = [
    "Theft",
    "Robbery",
    "Harassment",
    "Assault",
    "Suspicious Activity",
    "Other"
]

def load_data(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Training dataset not found at {filepath}")
    
    df = pd.read_csv(filepath)
    df = df.dropna(subset=['description', 'incident_type'])
    df['description'] = df['description'].astype(str).str.strip()
    df['incident_type'] = df['incident_type'].astype(str).str.strip()
    
    # Validate labels
    invalid_labels = set(df['incident_type']) - set(SUPPORTED_CLASSES)
    if invalid_labels:
        raise ValueError(f"Found invalid incident types: {invalid_labels}")
    
    return df

def train_and_evaluate(data_path="data/incident_training.csv", model_dir="model"):
    # Resolve relative paths relative to script directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    full_data_path = os.path.join(base_dir, data_path)
    full_model_dir = os.path.join(base_dir, model_dir)
    
    print(f"Loading training data from: {full_data_path}")
    df = load_data(full_data_path)
    print(f"Total training samples: {len(df)}")
    print("Class distribution:\n", df['incident_type'].value_counts())
    
    X = df['description']
    y = df['incident_type']
    
    # Train / test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    
    # Vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
        stop_words='english'
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Classifier
    clf = LogisticRegression(
        C=2.0,
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    )
    clf.fit(X_train_vec, y_train)
    
    # Evaluation
    y_pred = clf.predict(X_test_vec)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=SUPPORTED_CLASSES)
    
    print("\n" + "="*50)
    print("MODEL EVALUATION METRICS")
    print("="*50)
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1-Score : {f1:.4f}")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, zero_division=0))
    print("Confusion Matrix:\n", cm)
    print("="*50)
    
    # Save artifacts
    os.makedirs(full_model_dir, exist_ok=True)
    vec_path = os.path.join(full_model_dir, "tfidf_vectorizer.joblib")
    model_path = os.path.join(full_model_dir, "incident_classifier.joblib")
    
    joblib.dump(vectorizer, vec_path)
    joblib.dump(clf, model_path)
    print(f"Saved vectorizer to: {vec_path}")
    print(f"Saved model to: {model_path}")
    
    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1
    }

if __name__ == "__main__":
    train_and_evaluate()
