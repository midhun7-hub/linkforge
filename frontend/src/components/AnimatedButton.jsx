import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const AnimatedButton = ({ children, className, variant = 'primary', ...props }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
