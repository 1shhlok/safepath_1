"""
Unit tests for SafePath ML Service & Classifier
"""

import pytest
import os
import sys

# Ensure ml dir is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from evaluate import classify_description
from train import train_and_evaluate, SUPPORTED_CLASSES

@pytest.fixture(scope="session", autouse=True)
def setup_model():
    # Ensure model is trained
    train_and_evaluate()

def test_theft_classification():
    text = "Someone snatched my phone from my hand and ran away in the crowded market."
    res = classify_description(text)
    assert res["incidentType"] in SUPPORTED_CLASSES
    assert res["incidentType"] == "Theft"
    assert res["confidence"] > 0.3

def test_robbery_classification():
    text = "Two men stopped me with knives, threatened my life, and forced me to give my wallet and watch."
    res = classify_description(text)
    assert res["incidentType"] in SUPPORTED_CLASSES
    assert res["incidentType"] == "Robbery"
    assert res["confidence"] > 0.3

def test_harassment_classification():
    text = "A group of men was following me for several blocks making vulgar catcalls and threatening gestures."
    res = classify_description(text)
    assert res["incidentType"] in SUPPORTED_CLASSES
    assert res["incidentType"] == "Harassment"
    assert res["confidence"] > 0.3

def test_assault_classification():
    text = "An attacker punched me repeatedly in the face and kicked me while I was on the pavement."
    res = classify_description(text)
    assert res["incidentType"] in SUPPORTED_CLASSES
    assert res["incidentType"] == "Assault"
    assert res["confidence"] > 0.3

def test_suspicious_activity_classification():
    text = "Masked strangers trying car door handles and peering into windows with flashlights at midnight."
    res = classify_description(text)
    assert res["incidentType"] in SUPPORTED_CLASSES
    assert res["incidentType"] == "Suspicious Activity"
    assert res["confidence"] > 0.3

def test_other_classification():
    text = "The street light is broken and an open pothole is causing water accumulation."
    res = classify_description(text)
    assert res["incidentType"] in SUPPORTED_CLASSES
    assert res["incidentType"] == "Other"
    assert res["confidence"] > 0.3

def test_empty_or_whitespace():
    res = classify_description("")
    assert res["incidentType"] == "Other"
    assert res["confidence"] == 0.0
    assert res["isLowConfidence"] is True

def test_low_confidence_flag():
    # Ambiguous short string with very high threshold
    res = classify_description("a thing happened", confidence_threshold=0.99)
    assert res["isLowConfidence"] is True
