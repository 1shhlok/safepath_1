const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const { validateImageSignature } = require('../utils/fileSignature');

// Configure Cloudinary if environment variables are provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Ensure secure local uploads directory exists for fallback/development
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/evidence');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

// Multer memory storage configuration (5MB limit per file, max 3 files)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  }
});

/**
 * Middleware: parse multipart/form-data for evidence images
 */
const uploadEvidenceMiddleware = upload.array('evidence', 3);

/**
 * Middleware: Validate evidence images (size, MIME, extension, magic bytes)
 * and persist via Cloudinary or local secure storage.
 */
async function processAndValidateEvidence(req, res, next) {
  try {
    const files = req.files || [];

    // Rule: User must submit at least one evidence image
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'At least one evidence image is required for incident verification (maximum 3 images).'
      });
    }

    if (files.length > 3) {
      return res.status(400).json({
        error: 'Maximum of 3 evidence images permitted per report.'
      });
    }

    const processedEvidence = [];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    for (const file of files) {
      // 1. File size check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: `File '${file.originalname}' exceeds the 5MB size limit.`
        });
      }

      // 2. Extension check
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          error: `File '${file.originalname}' has unsupported extension '${ext}'. Allowed: JPEG, PNG, WebP.`
        });
      }

      // 3. MIME check
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `File '${file.originalname}' has unsupported MIME type '${file.mimetype}'.`
        });
      }

      // 4. File signature (magic bytes) validation
      const signatureResult = validateImageSignature(file.buffer);
      if (!signatureResult.valid) {
        return res.status(400).json({
          error: `File '${file.originalname}' failed security signature check: ${signatureResult.reason}`
        });
      }

      // 5. Store file securely
      if (isCloudinaryConfigured) {
        // Upload to Cloudinary using private authenticated delivery
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'safepath_evidence',
              type: 'authenticated', // Private authenticated access
              resource_type: 'image'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });

        // Generate short-lived signed delivery URL
        const signedUrl = cloudinary.url(uploadResult.public_id, {
          sign_url: true,
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
        });

        processedEvidence.push({
          publicId: uploadResult.public_id,
          url: signedUrl,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          storageType: 'cloudinary',
          uploadedAt: new Date()
        });
      } else {
        // Local secure storage fallback with unique token
        const uniqueToken = crypto.randomBytes(16).toString('hex');
        const safeExt = signatureResult.format === 'jpeg' ? '.jpg' : `.${signatureResult.format}`;
        const localFileName = `evidence_${Date.now()}_${uniqueToken}${safeExt}`;
        const localFilePath = path.join(LOCAL_UPLOAD_DIR, localFileName);

        fs.writeFileSync(localFilePath, file.buffer);

        processedEvidence.push({
          publicId: uniqueToken,
          url: `/api/reports/evidence/${localFileName}`,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          storageType: 'local_secure',
          uploadedAt: new Date()
        });
      }
    }

    req.evidenceImages = processedEvidence;
    req.isCloudinaryConfigured = isCloudinaryConfigured;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadEvidenceMiddleware,
  processAndValidateEvidence,
  isCloudinaryConfigured,
  LOCAL_UPLOAD_DIR
};
