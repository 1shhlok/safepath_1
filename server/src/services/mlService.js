const axios = require('axios');
const config = require('../config');

class MLService {
  /**
   * Sends incident description to Python ML microservice
   * @param {string} description 
   * @returns {Promise<{incidentType: string, confidence: number, isLowConfidence: boolean}>}
   */
  static async classifyIncident(description) {
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new Error('Valid incident description is required for ML classification');
    }

    const payload = {
      description: description.trim()
    };

    try {
      const response = await axios.post(`${config.mlServiceUrl}/predict`, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Malformed response received from ML classification service');
      }

      const { incidentType, confidence, isLowConfidence, probabilities } = response.data;

      // Validate incidentType belongs to supported categories
      if (!config.supportedCategories.includes(incidentType)) {
        throw new Error(`ML service returned unsupported incident category: ${incidentType}`);
      }

      // Validate confidence is a number between 0 and 1
      const numericConfidence = typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : 0.5;

      const flagLowConfidence = isLowConfidence ?? (numericConfidence < config.mlConfidenceThreshold);

      return {
        incidentType,
        confidence: numericConfidence,
        isLowConfidence: flagLowConfidence,
        probabilities: probabilities || {}
      };
    } catch (err) {
      // Check if ML service is unreachable
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        console.error(`[SafePath MLService] Microservice unreachable at ${config.mlServiceUrl}: ${err.message}`);
        // Return a controlled fallback error rather than crashing
        const error = new Error('Incident classification service is currently unavailable. Please try again shortly.');
        error.statusCode = 503;
        error.serviceUnavailable = true;
        throw error;
      }

      // Re-throw with clean message
      console.error('[SafePath MLService] Classification error:', err.response?.data || err.message);
      const error = new Error(err.response?.data?.error || err.message || 'Unable to classify incident description');
      error.statusCode = err.response?.status || 500;
      throw error;
    }
  }

  /**
   * Health check for ML microservice
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${config.mlServiceUrl}/health`, { timeout: 2000 });
      return response.status === 200 && response.data.status === 'healthy';
    } catch (err) {
      return false;
    }
  }
}

module.exports = MLService;
