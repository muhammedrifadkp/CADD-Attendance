import React from 'react'

const ResponsiveButton = ({
  children,
  className = '',
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target'

  const variantClasses = {
    primary: 'text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:ring-cadd-red shadow-lg hover:shadow-xl',
    secondary: 'text-white bg-gradient-to-r from-cadd-yellow to-yellow-600 hover:from-yellow-600 hover:to-cadd-yellow focus:ring-cadd-yellow shadow-lg hover:shadow-xl',
    outline: 'text-cadd-red border-2 border-cadd-red bg-transparent hover:bg-cadd-red hover:text-white focus:ring-cadd-red',
    ghost: 'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg hover:shadow-xl'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    default: 'px-4 py-2 text-sm min-h-[44px] sm:px-6 sm:py-3',
    lg: 'px-6 py-3 text-base min-h-[48px] sm:px-8 sm:py-4',
    xl: 'px-8 py-4 text-lg min-h-[52px] sm:px-10 sm:py-5'
  }

  const widthClasses = fullWidth ? 'w-full' : ''

  const iconSpacing = size === 'sm' ? 'space-x-1' : 'space-x-2'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${iconSpacing}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 100 100">
            <path
              d="M70,20 A40,40 0 1,0 70,80"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">
              {icon}
            </span>
          )}
          <span className="truncate">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  )
}

export default ResponsiveButton
