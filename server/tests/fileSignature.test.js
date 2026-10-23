const { validateImageSignature } = require('../src/utils/fileSignature');

describe('SafePath File Signature (Magic Bytes) Validation', () => {
  test('recognizes valid PNG binary signature', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
    const result = validateImageSignature(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('png');
    expect(result.mimeType).toBe('image/png');
  });

  test('recognizes valid JPEG binary signature', () => {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const result = validateImageSignature(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('jpeg');
    expect(result.mimeType).toBe('image/jpeg');
  });

  test('recognizes valid WebP binary signature', () => {
    // RIFF (offset 0) ... WEBP (offset 8)
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20
    ]);
    const result = validateImageSignature(webpBuffer);
    expect(result.valid).toBe(true);
    expect(result.format).toBe('webp');
    expect(result.mimeType).toBe('image/webp');
  });

  test('rejects spoofed text files or unsupported binary payloads', () => {
    const textBuffer = Buffer.from('GIF89a spoofed file that is not really valid');
    const result = validateImageSignature(textBuffer);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('File signature (magic bytes) does not match');
  });

  test('rejects truncated buffers under 12 bytes', () => {
    const shortBuffer = Buffer.from([0xFF, 0xD8]);
    const result = validateImageSignature(shortBuffer);
    expect(result.valid).toBe(false);
  });
});
