const fs = require('fs');

const matchesImageSignature = (buffer, mimeType) => {
  if (mimeType === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === 'image/gif') return ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  if (mimeType === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
};

const validateImageUpload = async (req, res, next) => {
  if (!req.file) return next();
  let handle;
  try {
    handle = await fs.promises.open(req.file.path, 'r');
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    await handle.close();
    handle = null;

    if (!matchesImageSignature(header.subarray(0, bytesRead), req.file.mimetype)) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: 'The selected file is not a valid image.' });
    }
    next();
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await fs.promises.unlink(req.file.path).catch(() => {});
    next(error);
  }
};

module.exports = validateImageUpload;
