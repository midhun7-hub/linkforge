import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Link2, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Smartphone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedCounter from '../components/AnimatedCounter';
import ThemePicker from '../components/ThemePicker';
import LinkForgeLogo from '../components/LinkForgeLogo';

const LandingPage = () => {
  const features = [
    {
      icon: Link2,
      title: 'Smart Shortening',
      description: 'Create short, memorable links with custom aliases for your brand.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track clicks, devices, locations, and referrers in real-time.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with HTTPS and data encryption.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant redirects with global CDN for maximum speed.'
    },
    {
      icon: Smartphone,
      title: 'Device Analytics',
      description: 'Understand your audience with detailed device and browser insights.'
    }
  ];

  const stats = [
    { icon: Link2, label: 'URLs Shortened' },
    { icon: BarChart3, label: 'Real-Time Analytics' },
    { icon: Sparkles, label: 'Custom Aliases' },
    { icon: QrCode, label: 'QR Codes Generated' }
  ];

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--decorative-1)' }}
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-20 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'var(--decorative-2)' }}
          animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <nav className="fixed z-50 top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 nav-floating-capsule max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-3 h-14 sm:h-16 px-4 sm:px-5">
          <Link to="/" className="linkforge-logo-hover flex items-center gap-2">
            <LinkForgeLogo size={32} className="w-8 h-8" />
            <span className="text-xl font-bold gradient-text">LinkForge</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemePicker />
            <Link
              to="/login"
              className="text-sm sm:text-base font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2"
            >
              Login
            </Link>
            <Link to="/register">
              <AnimatedButton variant="primary" className="text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3">
                Get Started Free
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 soft-surface px-4 py-2 text-sm font-medium theme-text-secondary mb-6">
              <Sparkles size={16} className="theme-icon-accent" />
              Premium short links for modern teams
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 theme-text-primary">
              <span className="gradient-text">Forge Smarter Links.</span>
              <br />
              <span className="theme-text-primary">Track Every Click.</span>
            </h1>
            <p className="text-xl theme-text-secondary mb-8 max-w-2xl mx-auto">
              The modern URL shortener with powerful analytics. Create short links, 
              track performance, and optimize your marketing campaigns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <AnimatedButton
                  variant="primary"
                  className="text-lg px-8 py-4 flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              'Progressive URL creation workflow',
              'Real-time click intelligence',
              'Team-ready dashboard ergonomics'
            ].map((item) => (
              <div key={item} className="soft-surface p-4 text-left">
                <div className="flex items-center gap-2 mb-2 theme-icon-accent">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold theme-text-primary">Included</span>
                </div>
                <p className="font-medium theme-text-secondary">{item}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 theme-section-alt">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 theme-text-primary">Trusted by thousands</h2>
            <p className="theme-text-secondary text-lg">Join the community of marketers and developers</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <AnimatedCard key={index} delay={index * 0.08} className="text-center premium-card">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <stat.icon className="w-6 h-6 theme-icon-accent" />
                </div>
                <div className="theme-text-secondary">{stat.label}</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 theme-text-primary">Powerful Features</h2>
            <p className="theme-text-secondary text-lg">Everything you need to manage your links</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedCard key={index} delay={index * 0.08} className="premium-card hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-xl feature-icon-wrap flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 theme-text-primary">{feature.title}</h3>
                <p className="theme-text-secondary">{feature.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 theme-section-alt">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 theme-text-primary">How It Works</h2>
            <p className="theme-text-secondary text-lg">Get started in 3 simple steps</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Account', description: 'Sign up for free in seconds' },
              { step: '2', title: 'Shorten URL', description: 'Paste your long URL and get a short link' },
              { step: '3', title: 'Track Analytics', description: 'Monitor clicks and analyze performance' }
            ].map((item, index) => (
              <AnimatedCard key={index} delay={index * 0.08} className="text-center premium-card">
                <div className="w-16 h-16 step-badge rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 theme-text-primary">{item.title}</h3>
                <p className="theme-text-secondary">{item.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="premium-card p-12"
          >
            <h2 className="text-4xl font-bold mb-6 theme-text-primary">Ready to get started?</h2>
            <p className="text-xl theme-text-secondary mb-8">
              Join thousands of marketers and developers who trust LinkForge
            </p>
            <Link to="/register">
                <AnimatedButton variant="primary">Get Started Free</AnimatedButton>
              </Link>
          </motion.div>
        </div>
      </section>

      <footer className="theme-footer py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <LinkForgeLogo size={32} className="w-8 h-8" />
                <span className="text-xl font-bold">LinkForge</span>
              </div>
              <p className="theme-footer-muted">Forge Smarter Links. Track Every Click.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 theme-footer-muted">
                <li><Link to="#" className="footer-link">Privacy</Link></li>
                <li><Link to="#" className="footer-link">Terms</Link></li>
                <li><Link to="#" className="footer-link">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center theme-footer-muted" style={{ borderColor: 'color-mix(in srgb, var(--footer-muted) 40%, transparent)' }}>
            <p>&copy; 2026 LinkForge. All rights reserved.</p>
            <p className="mt-2 text-sm">This project is a part of a hackathon run by https://katomaran.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
