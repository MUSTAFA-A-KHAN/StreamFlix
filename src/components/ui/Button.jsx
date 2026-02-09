import { FiLoader } from 'react-icons/fi'

// Button Component
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-netflix-red text-white hover:bg-red-700 focus:ring-netflix-red',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500',
    outline: 'border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500',
    ghost: 'text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  }[variant]

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
    xl: 'px-8 py-4 text-xl gap-3',
  }[size]

  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        min-h-[44px] touch-manipulation
        ${variantClasses[variant]}
        ${sizeClasses}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && <FiLoader className="animate-spin mr-2" size={16} />}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}

export default Button
