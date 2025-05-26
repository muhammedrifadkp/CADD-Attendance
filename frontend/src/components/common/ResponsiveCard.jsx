import React from 'react'

const ResponsiveCard = ({ 
  children, 
  className = '',
  padding = 'default',
  shadow = 'default',
  rounded = 'default',
  hover = false,
  gradient = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  }

  const roundedClasses = {
    none: '',
    sm: 'rounded-lg',
    default: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl'
  }

  const baseClasses = 'bg-white border border-gray-100'
  const hoverClasses = hover ? 'hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer' : ''
  const gradientClasses = gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''

  return (
    <div className={`
      ${baseClasses}
      ${paddingClasses[padding]}
      ${shadowClasses[shadow]}
      ${roundedClasses[rounded]}
      ${hoverClasses}
      ${gradientClasses}
      ${className}
    `}>
      {children}
    </div>
  )
}

export default ResponsiveCard
