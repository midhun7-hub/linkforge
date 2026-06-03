import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const AnimatedCard = ({ children, className, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn('glass-card p-6', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
