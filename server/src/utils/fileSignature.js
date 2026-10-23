/**
 * File signature (magic bytes) validation for SafePath evidence uploads
 * Validates JPEG, PNG, and WebP binary headers
 */

function validateImageSignature(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false, format: null, reason: 'File buffer too short for signature validation' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, format: 'jpeg', mimeType: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const isPng = pngSignature.every((byte, index) => buffer[index] === byte);
  if (isPng) {
    return { valid: true, format: 'png', mimeType: 'image/png' };
  }

  // 3. WebP: RIFF at byte 0-3 and WEBP at byte 8-11
  const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return { valid: true, format: 'webp', mimeType: 'image/webp' };
  }

  return { valid: false, format: null, reason: 'File signature (magic bytes) does not match JPEG, PNG, or WebP' };
}

module.exports = {
  validateImageSignature
};
