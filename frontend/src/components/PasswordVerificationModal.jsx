import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import api from '../utils/api';

const PasswordVerificationModal = ({ open, shortCode, onClose, onSuccess, mode = 'redirect' }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post(`/api/urls/verify/${shortCode}`, { password });
      
      if (response.data.success) {
        if (mode === 'redirect') {
          toast.success('Password verified! Redirecting...');
          // Redirect to the original URL after a short delay
          setTimeout(() => {
            window.location.href = response.data.redirectUrl;
          }, 500);
        } else {
          toast.success('Password verified!');
          // Call callback without redirecting
          onSuccess?.(response.data);
          handleClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password verification failed');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-modal relative w-full max-w-md p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-muted)] flex items-center justify-center mb-4"
          >
            <Lock className="text-[var(--accent)]" size={32} />
          </motion.div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Access Protected Link</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">This link is password protected</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Enter Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter the password"
                className={cn(
                  'input-field pr-10',
                  error && 'border-danger'
                )}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-gap-2 p-3 rounded-lg bg-[var(--danger-muted)] border border-[var(--danger)]"
            >
              <AlertCircle className="text-[var(--danger)] shrink-0" size={16} />
              <p className="text-sm text-[var(--danger)] ml-2">{error}</p>
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordVerificationModal;
