import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  ClipboardPaste,
  Sparkles,
  Hash,
  Calendar,
  CalendarClock,
  Lock,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Copy,
  QrCode,
  ExternalLink,
  Plus,
  AlertCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useCreateUrl } from '../hooks/useUrls';
import { toast } from 'sonner';
import { cn } from '../utils/cn';

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidPassword = (password) => {
  // 8+ chars, uppercase, lowercase, number, special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  return passwordRegex.test(password);
};

const PROGRESS_STEPS = [
  'Validating URL',
  'Generating Short Link',
  'Configuring Analytics',
  'Finalizing Link',
];

const initialForm = {
  originalUrl: '',
  customAlias: '',
  expiryDate: '',
  startDate: '',
  linkPassword: '',
  linkPasswordConfirm: '',
  linkActive: true,
};

const SettingCard = ({ icon: Icon, title, subtitle, children, preview, className }) => (
  <div className={cn('glass-card p-4 space-y-3', className)}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
          <Icon size={18} />
        </div>
        <div>
          <p className="font-medium text-[var(--text-primary)]">{title}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {preview && (
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
          Preview
        </span>
      )}
    </div>
    {children}
  </div>
);

const CreateLinkModal = ({ open, onClose, onOpenQR }) => {
  const createUrl = useCreateUrl();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [urlError, setUrlError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [progressIndex, setProgressIndex] = useState(-1);
  const [createdUrl, setCreatedUrl] = useState(null);
  const [createError, setCreateError] = useState('');
  const progressStarted = useRef(false);

  const reset = () => {
    setStep(1);
    setFormData(initialForm);
    setUrlError('');
    setPasswordError('');
    setProgressIndex(-1);
    setCreatedUrl(null);
    setCreateError('');
    progressStarted.current = false;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setFormData((prev) => ({ ...prev, originalUrl: text.trim() }));
        setUrlError('');
      }
    } catch {
      toast.error('Unable to paste from clipboard');
    }
  };

  const handleNextFromStep1 = () => {
    const url = formData.originalUrl.trim();
    if (!isValidUrl(url)) {
      setUrlError('Enter a valid URL starting with http:// or https://');
      return;
    }
    setUrlError('');
    setStep(2);
  };

  const runCreation = async () => {
    // Validate password if provided
    if (formData.linkPassword) {
      if (!isValidPassword(formData.linkPassword)) {
        setPasswordError('Password must be 8+ characters with uppercase, lowercase, number, and special character');
        setStep(2);
        return;
      }
      if (formData.linkPassword !== formData.linkPasswordConfirm) {
        setPasswordError('Passwords do not match');
        setStep(2);
        return;
      }
    }

    const payload = {
      originalUrl: formData.originalUrl.trim(),
      customAlias: formData.customAlias.trim(),
      expiryDate: formData.expiryDate,
    };

    // Only include password if provided
    if (formData.linkPassword) {
      payload.password = formData.linkPassword;
    }

    for (let i = 0; i < PROGRESS_STEPS.length; i++) {
      setProgressIndex(i);
      await new Promise((r) => setTimeout(r, 550));
    }

    try {
      const created = await createUrl.mutateAsync(payload);
      setCreatedUrl(created);
      setStep(4);
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Failed to create link');
      setStep(4);
    }
  };

  useEffect(() => {
    if (step !== 3 || progressStarted.current) return;
    progressStarted.current = true;
    runCreation();
  }, [step]);

  const handleCopy = () => {
    if (createdUrl?.shortUrl) {
      navigator.clipboard.writeText(createdUrl.shortUrl);
      toast.success('URL copied to clipboard!');
    }
  };

  const handleCreateAnother = () => {
    reset();
    setStep(1);
  };

  if (!open) return null;

  const stepLabels = ['Destination', 'Advanced', 'Creating', 'Complete'];

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
        className="glass-modal relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1 flex items-center gap-1.5">
              <Sparkles size={14} />
              Premium Link Studio
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Create Smart Link</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1">
              <div
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  step >= s ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                )}
              />
              <p className={cn('text-[10px] mt-1.5 hidden sm:block', step >= s ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
                {stepLabels[s - 1]}
              </p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-5"
            >
              <div className="glass-card p-5">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Long URL
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="url"
                    value={formData.originalUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, originalUrl: e.target.value });
                      if (urlError) setUrlError('');
                    }}
                    className="input-field pl-10 pr-24"
                    placeholder="https://example.com/your-long-url"
                  />
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] hover:opacity-90 transition-opacity"
                  >
                    <ClipboardPaste size={14} />
                    Paste
                  </button>
                </div>
                {urlError && <p className="text-sm text-danger mt-2">{urlError}</p>}
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  We&apos;ll validate your destination before shortening.
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleClose} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="button" onClick={handleNextFromStep1} className="flex-1 btn-primary">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-4"
            >
              <p className="text-sm text-[var(--text-muted)] mb-2">Advanced settings</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SettingCard icon={Hash} title="Custom Alias" subtitle="Brand your short link">
                  <input
                    type="text"
                    value={formData.customAlias}
                    onChange={(e) => setFormData({ ...formData, customAlias: e.target.value })}
                    className="input-field"
                    placeholder="my-brand"
                  />
                </SettingCard>
                <SettingCard icon={Calendar} title="Expiry Date" subtitle="Auto-disable after date">
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="input-field"
                  />
                </SettingCard>
                <SettingCard icon={CalendarClock} title="Start Date" subtitle="Schedule link activation" preview>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                  />
                </SettingCard>
                <SettingCard icon={Lock} title="Password Protection" subtitle="Require password to access" preview>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="password"
                        value={formData.linkPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, linkPassword: e.target.value });
                          if (passwordError) setPasswordError('');
                        }}
                        className="input-field w-full"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={formData.linkPasswordConfirm}
                        onChange={(e) => {
                          setFormData({ ...formData, linkPasswordConfirm: e.target.value });
                          if (passwordError) setPasswordError('');
                        }}
                        className="input-field w-full"
                        placeholder="Confirm password"
                        disabled={!formData.linkPassword}
                      />
                    </div>
                    {formData.linkPassword && (
                      <div className="text-xs text-[var(--text-muted)] space-y-1">
                        <div className={isValidPassword(formData.linkPassword) ? 'text-[var(--success)]' : ''}>
                          ✓ 8+ characters
                        </div>
                      </div>
                    )}
                    {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
                  </div>
                </SettingCard>
                <SettingCard
                  icon={formData.linkActive ? ToggleRight : ToggleLeft}
                  title="Link Status"
                  subtitle={formData.linkActive ? 'Active — link is live' : 'Disabled — link is paused'}
                  preview
                  className="sm:col-span-2"
                >
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, linkActive: !formData.linkActive })}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all',
                      formData.linkActive
                        ? 'toggle-active-state'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
                    )}
                  >
                    <span className="font-medium">{formData.linkActive ? 'Active' : 'Disabled'}</span>
                    {formData.linkActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </SettingCard>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 btn-secondary">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    progressStarted.current = false;
                    setProgressIndex(-1);
                    setStep(3);
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  Generate Link
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 space-y-6"
            >
              <p className="text-center text-[var(--text-muted)]">Crafting your premium short link…</p>
              <div className="space-y-4 max-w-md mx-auto">
                {PROGRESS_STEPS.map((label, i) => {
                  const done = progressIndex > i;
                  const active = progressIndex === i;
                  return (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300',
                          done && 'progress-step-done',
                          active && !done && 'border-[var(--accent)] text-[var(--accent)]',
                          !done && !active && 'border-[var(--border)] text-[var(--text-muted)]'
                        )}
                      >
                        {done ? (
                          <CheckCircle2 size={18} />
                        ) : active ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-medium', done || active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                          {label}
                        </p>
                        {(done || active) && (
                          <div className="h-1 mt-2 rounded-full bg-[var(--border)] overflow-hidden">
                            <motion.div
                              className="h-full bg-[var(--accent)]"
                              initial={{ width: 0 }}
                              animate={{ width: done ? '100%' : active ? '70%' : 0 }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 4 && createdUrl && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                className="w-16 h-16 mx-auto rounded-full modal-success-icon flex items-center justify-center"
              >
                <CheckCircle2 size={36} />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Link created successfully</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">Your short URL is ready to share</p>
              </div>
              <div className="glass-card p-4 text-left">
                <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Short URL</p>
                <p className="text-lg font-semibold text-[var(--accent)] break-all">{createdUrl.shortUrl}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button type="button" onClick={handleCopy} className="btn-secondary flex items-center justify-center gap-2 text-sm">
                  <Copy size={16} />
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => onOpenQR?.(createdUrl)}
                  className="btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <QrCode size={16} />
                  QR
                </button>
                <a
                  href={createdUrl.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={16} />
                  Open
                </a>
                <button type="button" onClick={handleCreateAnother} className="btn-primary flex items-center justify-center gap-2 text-sm">
                  <Plus size={16} />
                  New
                </button>
              </div>
              <button type="button" onClick={handleClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
                Done
              </button>
            </motion.div>
          )}

          {step === 4 && !createdUrl && createError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="glass-card p-6 modal-error-box text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-danger" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Couldn&apos;t create link</h3>
                <p className="text-sm text-[var(--text-muted)] mt-2">{createError}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleClose} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateError('');
                    progressStarted.current = false;
                    setProgressIndex(-1);
                    setStep(3);
                  }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CreateLinkModal;
