import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const QRCodeGenerator = ({ url }) => {
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qr = await QRCode.toDataURL(url);
        setQrCode(qr);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    if (url) generateQR();
  }, [url]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'qrcode.png';
    link.click();
    toast.success('QR Code downloaded!');
  };

  if (!qrCode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center space-y-4"
    >
      <div className="p-4 rounded-xl shadow-lg theme-card">
        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleCopy}
          className="btn-secondary flex items-center space-x-2"
        >
          {copied ? <Check size={18} style={{ color: 'var(--success)' }} /> : <Copy size={18} />}
          <span>{copied ? 'Copied!' : 'Copy URL'}</span>
        </button>
        <button
          onClick={handleDownload}
          className="btn-primary flex items-center space-x-2"
        >
          <Download size={18} />
          <span>Download QR</span>
        </button>
      </div>
    </motion.div>
  );
};

export default QRCodeGenerator;
