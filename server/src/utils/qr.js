const QRCode = require('qrcode');

async function generateQR(text) {
  return QRCode.toDataURL(text);
}

module.exports = { generateQR };
