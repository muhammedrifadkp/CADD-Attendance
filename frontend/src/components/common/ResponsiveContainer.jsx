import React from 'react'

const ResponsiveContainer = ({ 
  children, 
  className = '', 
  padding = 'default',
  maxWidth = '7xl'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4 py-2 sm:py-4',
    default: 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8',
    lg: 'px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-12'
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

export default ResponsiveContainer
