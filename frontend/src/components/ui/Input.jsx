import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, X, Search } from 'lucide-react';

const Input = React.forwardRef(({
  type = 'text',
  label,
  placeholder,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  const baseClasses = 'block border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    default: 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
    filled: 'border-transparent bg-gray-100 focus:ring-primary-500 focus:bg-white',
    outlined: 'border-2 border-gray-300 focus:ring-primary-500 focus:border-primary-500',
  };

  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : success 
    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
    : variantClasses[variant];

  const inputClasses = [
    baseClasses,
    sizeClasses[size],
    stateClasses,
    fullWidth ? 'w-full' : '',
    leftIcon ? 'pl-10' : '',
    rightIcon || isPassword ? 'pr-10' : '',
    disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');

  const iconSize = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(leftIcon, {
              className: `${iconSize} text-gray-400`,
            })}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {(rightIcon || isPassword || error || success) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className={iconSize} />
                ) : (
                  <Eye className={iconSize} />
                )}
              </button>
            )}
            
            {!isPassword && error && (
              <AlertCircle className={`${iconSize} text-red-500`} />
            )}
            
            {!isPassword && success && (
              <Check className={`${iconSize} text-green-500`} />
            )}
            
            {!isPassword && !error && !success && rightIcon && (
              React.cloneElement(rightIcon, {
                className: `${iconSize} text-gray-400`,
              })
            )}
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              {error}
            </p>
          )}
          {!error && success && (
            <p className="text-sm text-green-600 flex items-center">
              <Check className="w-4 h-4 mr-1 flex-shrink-0" />
              {success}
            </p>
          )}
          {!error && !success && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
export const Textarea = React.forwardRef(({
  label,
  placeholder,
  error,
  success,
  helperText,
  disabled = false,
  required = false,
  fullWidth = true,
  rows = 3,
  resize = 'vertical',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  
  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : success 
    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
    : '';

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  const textareaClasses = [
    baseClasses,
    stateClasses,
    resizeClasses[resize],
    disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={textareaClasses}
        {...props}
      />
      
      {(error || success || helperText) && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              {error}
            </p>
          )}
          {!error && success && (
            <p className="text-sm text-green-600 flex items-center">
              <Check className="w-4 h-4 mr-1 flex-shrink-0" />
              {success}
            </p>
          )}
          {!error && !success && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
export const Select = React.forwardRef(({
  label,
  placeholder = 'Selecione uma opção',
  options = [],
  error,
  success,
  helperText,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'medium',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'block border border-gray-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white';
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  };

  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
    : success 
    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
    : '';

  const selectClasses = [
    baseClasses,
    sizeClasses[size],
    stateClasses,
    fullWidth ? 'w-full' : '',
    disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        ref={ref}
        disabled={disabled}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {(error || success || helperText) && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              {error}
            </p>
          )}
          {!error && success && (
            <p className="text-sm text-green-600 flex items-center">
              <Check className="w-4 h-4 mr-1 flex-shrink-0" />
              {success}
            </p>
          )}
          {!error && !success && helperText && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Search Input Component
export function SearchInput({
  placeholder = 'Pesquisar...',
  onSearch,
  onClear,
  debounceMs = 300,
  className = '',
  ...props
}) {
  const [value, setValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = React.useRef(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newValue.trim()) {
      setIsSearching(true);
      debounceRef.current = setTimeout(() => {
        onSearch?.(newValue);
        setIsSearching(false);
      }, debounceMs);
    } else {
      onClear?.();
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setValue('');
    onClear?.();
    setIsSearching(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={<Search />}
        rightIcon={
          value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          )
        }
        className={className}
        {...props}
      />
      
      {isSearching && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}

// Checkbox Component
export const Checkbox = React.forwardRef(({
  label,
  description,
  error,
  disabled = false,
  size = 'medium',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5',
  };

  const checkboxClasses = [
    sizeClasses[size],
    'text-primary-600 focus:ring-primary-500 border-gray-300 rounded',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    error ? 'border-red-300' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-start">
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        className={checkboxClasses}
        {...props}
      />
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}>
              {label}
            </label>
          )}
          {description && (
            <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio Component
export const Radio = React.forwardRef(({
  label,
  description,
  error,
  disabled = false,
  size = 'medium',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5',
  };

  const radioClasses = [
    sizeClasses[size],
    'text-primary-600 focus:ring-primary-500 border-gray-300',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    error ? 'border-red-300' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-start">
      <input
        ref={ref}
        type="radio"
        disabled={disabled}
        className={radioClasses}
        {...props}
      />
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}>
              {label}
            </label>
          )}
          {description && (
            <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

// Switch Component
export const Switch = React.forwardRef(({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked 
            ? 'bg-primary-600' 
            : 'bg-gray-300'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        {...props}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label className={`block text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
              {label}
            </label>
          )}
          {description && (
            <p className={`text-xs ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

// ColorPicker Component (básico)
export const ColorPicker = React.forwardRef(({
  value = '#3B82F6',
  onChange,
  label,
  error,
  className = '',
  ...props
}, ref) => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
    '#EC4899', '#6366F1', '#14B8A6', '#F59E0B'
  ];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange && onChange(color)}
            className={`
              w-8 h-8 rounded-lg border-2 transition-all
              ${value === color 
                ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <input
        ref={ref}
        type="color"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="sr-only"
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export { Input };
export default Input;