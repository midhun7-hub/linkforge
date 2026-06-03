import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import LinkForgeLogo from '../components/LinkForgeLogo';
import { toast } from 'sonner';
import AnimatedButton from '../components/AnimatedButton';

const RegisterPage = () => {
  const passwordRequirementsText = 'Minimum 8 characters, including uppercase, lowercase, number, and special character.';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmPasswordError('');

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    setLoading(true);

    const result = await register(name, email, password);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="linkforge-logo-hover inline-flex items-center space-x-2 mb-6">
            <LinkForgeLogo size={40} className="w-10 h-10" />
            <span className="text-2xl font-bold gradient-text">LinkForge</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2 theme-text-primary">Create account</h1>
          <p className="theme-text-secondary">Start shortening links today</p>
        </div>

        <div className="card theme-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 input-icon" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 input-icon" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 input-icon" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
                  title={passwordRequirementsText}
                />
              </div>
              <p className="text-xs theme-text-muted mt-1">{passwordRequirementsText}</p>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 input-icon" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
              {confirmPasswordError && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <AnimatedButton
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight size={20} />}
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center">
            <p className="theme-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-link font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
