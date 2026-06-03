import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { toast } from 'sonner';
import AnimatedCard from '../components/AnimatedCard';
import {
  User,
  Mail,
  Lock,
  Calendar,
  AlertTriangle,
  Save,
  Trash2,
  Palette,
  Sparkles,
} from 'lucide-react';
import { cn } from '../utils/cn';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { themeId, theme, setTheme, themes } = useTheme();

  const handleThemeChange = (nextId) => {
    setTheme(nextId);
    const label = themes.find((t) => t.id === nextId)?.label || nextId;
    toast.success(`Theme: ${label}`);
  };
  const [loading, setLoading] = useState(false);
  const [memberSince, setMemberSince] = useState(user?.createdAt || null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setMemberSince(user?.createdAt || null);
  }, [user?.createdAt]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/auth/profile');
        setMemberSince(response.data?.user?.createdAt || null);
      } catch {
        // Keep fallback from auth context.
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/api/auth/delete-account');
        toast.success('Account deleted successfully');
        logout();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">Preferences</p>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-muted)]">Personalize your workspace and manage your account</p>
      </motion.div>

      <AnimatedCard delay={0.05} className="premium-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{
              color: 'var(--btn-on-accent)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
            }}
          >
            {initials || 'LF'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{user?.name}</h2>
            <p className="text-[var(--text-muted)] flex items-center gap-2 mt-1">
              <Mail size={16} />
              {user?.email}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2 flex items-center gap-2">
              <Calendar size={16} />
              Member since {memberSince ? new Date(memberSince).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] text-sm font-medium">
            <Sparkles size={16} />
            Premium
          </div>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={0.1} className="premium-card">
        <div className="flex items-center space-x-2 mb-6">
          <Palette className="w-6 h-6 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Appearance</h2>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--text-primary)]">Theme</label>
          <select
            value={themeId}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="input-field max-w-xs"
            aria-label="Select theme"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Accent color preview</p>
            <div className="flex flex-wrap gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all',
                    themeId === t.id ? 'border-[var(--accent)] scale-105' : 'border-transparent hover:border-[var(--border)]'
                  )}
                >
                  <div className="flex rounded-lg overflow-hidden shadow-md h-8 w-20">
                    {t.preview.map((color, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={0.15} className="premium-card">
        <div className="flex items-center space-x-2 mb-6">
          <User className="w-6 h-6 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Profile Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-card p-4">
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Name</label>
            <div className="flex items-center space-x-3">
              <User className="text-[var(--text-muted)]" size={20} />
              <span className="text-lg text-[var(--text-primary)]">{user?.name}</span>
            </div>
          </div>
          <div className="glass-card p-4">
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Email</label>
            <div className="flex items-center space-x-3">
              <Mail className="text-[var(--text-muted)]" size={20} />
              <span className="text-lg text-[var(--text-primary)]">{user?.email}</span>
            </div>
          </div>
          <div className="glass-card p-4 sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Member Since</label>
            <div className="flex items-center space-x-3">
              <Calendar className="text-[var(--text-muted)]" size={20} />
              <span className="text-lg text-[var(--text-primary)]">
                {memberSince ? new Date(memberSince).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={0.2} className="premium-card">
        <div className="flex items-center space-x-2 mb-6">
          <Lock className="w-6 h-6 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="input-field"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="input-field"
              required
              minLength={8}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
            <Save size={20} />
            <span>{loading ? 'Changing...' : 'Change Password'}</span>
          </button>
        </form>
      </AnimatedCard>

      <AnimatedCard delay={0.25} className="premium-card border-red-500/30">
        <div className="flex items-center space-x-2 mb-6">
          <AlertTriangle className="w-6 h-6 text-[var(--danger)]" />
          <h2 className="text-xl font-semibold text-[var(--danger)]">Danger Zone</h2>
        </div>
        <p className="text-[var(--text-muted)] mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-6 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center space-x-2"
          style={{ backgroundColor: 'var(--danger)', color: 'var(--btn-on-accent)' }}
        >
          <Trash2 size={20} />
          <span>Delete Account</span>
        </button>
      </AnimatedCard>
    </div>
  );
};

export default SettingsPage;
