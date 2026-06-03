import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import PasswordVerificationModal from '../components/PasswordVerificationModal';
import LinkForgeLogo from '../components/LinkForgeLogo';

const VerifyPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shortCode = searchParams.get('code');
  const [isOpen, setIsOpen] = useState(false);
  
  // Get referrer from state, default to /
  const referrer = location.state?.referrer || '/';

  useEffect(() => {
    if (shortCode) {
      setIsOpen(true);
    } else {
      // No code provided, redirect to referrer or home
      navigate(referrer);
    }
  }, [shortCode, navigate, referrer]);

  const handleClose = () => {
    setIsOpen(false);
    // Return to the page user came from, or home as fallback
    navigate(referrer);
  };

  if (!shortCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-danger" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Invalid Link</h1>
          <p className="text-[var(--text-muted)] mt-2">The link you're trying to access is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-hover)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 50%)',
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <LinkForgeLogo size={48} className="w-12 h-12 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">LinkForge</h1>
          <p className="text-[var(--text-muted)] mt-1">Secure Short Links</p>
        </div>
      </motion.div>

      <PasswordVerificationModal
        open={isOpen}
        shortCode={shortCode}
        onClose={handleClose}
        onSuccess={() => {
          // Redirect handled by component
        }}
      />
    </div>
  );
};

export default VerifyPasswordPage;
