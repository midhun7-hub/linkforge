import { cn } from '../utils/cn';

/**
 * Official LinkForge mark — single asset at /linkforge-logo.svg.
 * Theme colors come from CSS variables on the masked element.
 */
const LinkForgeLogo = ({ size = 32, className, title = 'LinkForge' }) => (
  <span
    className={cn('linkforge-logo inline-block shrink-0', className)}
    style={{ width: size, height: size }}
    role="img"
    aria-label={title}
  />
);

export default LinkForgeLogo;
