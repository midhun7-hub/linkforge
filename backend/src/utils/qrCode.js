import QRCode from 'qrcode';

export const generateQRCode = async (url) => {
  try {
    const qrCode = await QRCode.toDataURL(url);
    return qrCode;
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '[QR ERROR]', error.message);
    throw new Error('Failed to generate QR code');
  }
};
