const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload an image file (base64 data URI or raw buffer)
// @route   POST /api/upload
// @access  Private (Authenticated users e.g. Sellers, Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const { data, filename, contentType } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    // Match data URI prefix: data:image/png;base64,...
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let extension = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
      if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('webp')) extension = 'webp';
      else if (mimeType.includes('gif')) extension = 'gif';
      else if (mimeType.includes('svg')) extension = 'svg';
      else extension = 'jpg';
    } else {
      // Raw base64 string
      buffer = Buffer.from(data, 'base64');
      if (filename) {
        const ext = path.extname(filename).replace('.', '').toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
          extension = ext;
        }
      }
    }

    // Max 10MB file limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds maximum allowed limit of 10MB',
      });
    }

    const uniqueName = `product-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl,
      filename: uniqueName,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
