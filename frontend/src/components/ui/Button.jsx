import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm hover:shadow-md',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500',
    'outline-primary': 'border border-primary-600 text-primary-600 bg-white hover:bg-primary-50 focus:ring-primary-500',
    'outline-success': 'border border-green-600 text-green-600 bg-white hover:bg-green-50 focus:ring-green-500',
    'outline-warning': 'border border-yellow-600 text-yellow-600 bg-white hover:bg-yellow-50 focus:ring-yellow-500',
    'outline-error': 'border border-red-600 text-red-600 bg-white hover:bg-red-50 focus:ring-red-500',
    ghost: 'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-primary-500',
    'ghost-primary': 'text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-primary-500',
    'ghost-success': 'text-green-600 bg-transparent hover:bg-green-50 focus:ring-green-500',
    'ghost-warning': 'text-yellow-600 bg-transparent hover:bg-yellow-50 focus:ring-yellow-500',
    'ghost-error': 'text-red-600 bg-transparent hover:bg-red-50 focus:ring-red-500',
    link: 'text-primary-600 bg-transparent hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500 p-0',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
    xlarge: 'px-8 py-4 text-lg',
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
    xlarge: 'w-6 h-6',
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    variant !== 'link' ? sizeClasses[size] : '',
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const iconSize = iconSizeClasses[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <Loader2 className={`${iconSize} mr-2 animate-spin`} />
      )}
      
      {!loading && leftIcon && (
        React.cloneElement(leftIcon, {
          className: `${iconSize} ${children ? 'mr-2' : ''}`,
        })
      )}
      
      {children}
      
      {!loading && rightIcon && (
        React.cloneElement(rightIcon, {
          className: `${iconSize} ${children ? 'ml-2' : ''}`,
        })
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Button Group Component
export function ButtonGroup({ 
  children, 
  variant = 'outline',
  size = 'medium',
  fullWidth = false,
  className = '' 
}) {
  const groupClasses = [
    'inline-flex',
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses} role="group">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        const isMiddle = !isFirst && !isLast;

        let buttonClasses = '';
        
        if (isFirst) {
          buttonClasses = 'rounded-r-none border-r-0';
        } else if (isLast) {
          buttonClasses = 'rounded-l-none';
        } else if (isMiddle) {
          buttonClasses = 'rounded-none border-r-0';
        }

        return React.cloneElement(child, {
          variant: child.props.variant || variant,
          size: child.props.size || size,
          className: `${child.props.className || ''} ${buttonClasses}`.trim(),
          style: {
            ...child.props.style,
            ...(fullWidth ? { flex: '1' } : {}),
          },
        });
      })}
    </div>
  );
}

// Icon Button Component
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'medium',
  round = false,
  tooltip,
  className = '',
  ...props
}) {
  const sizeClasses = {
    small: 'p-1.5',
    medium: 'p-2',
    large: 'p-3',
    xlarge: 'p-4',
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
    xlarge: 'w-8 h-8',
  };

  const buttonClassName = [
    sizeClasses[size],
    round ? 'rounded-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const iconElement = React.cloneElement(icon, {
    className: iconSizeClasses[size],
  });

  return (
    <Button
      variant={variant}
      size="medium"
      className={buttonClassName}
      title={tooltip}
      {...props}
    >
      {iconElement}
    </Button>
  );
}

// Floating Action Button Component
export function FloatingActionButton({
  icon,
  variant = 'primary',
  size = 'large',
  position = 'bottom-right',
  className = '',
  ...props
}) {
  const positionClasses = {
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
  };

  const fabClassName = [
    'fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
    positionClasses[position],
    className,
  ].filter(Boolean).join(' ');

  return (
    <IconButton
      icon={icon}
      variant={variant}
      size={size}
      round={true}
      className={fabClassName}
      {...props}
    />
  );
}

// Split Button Component
export function SplitButton({
  children,
  dropdownItems = [],
  variant = 'primary',
  size = 'medium',
  onMainClick,
  disabled = false,
  loading = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-flex ${className}`} ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        onClick={onMainClick}
        className="rounded-r-none border-r-0"
      >
        {children}
      </Button>
      
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-l-none px-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && dropdownItems.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {dropdownItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {item.icon && (
                <span className="inline-flex items-center mr-2">
                  {React.cloneElement(item.icon, { className: 'w-4 h-4' })}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Button;