import React from 'react'

const ResponsiveGrid = ({ 
  children, 
  className = '',
  cols = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    large: 4
  },
  gap = 'default'
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2 sm:gap-3',
    default: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-10'
  }

  const gridCols = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} xl:grid-cols-${cols.large}`

  return (
    <div className={`grid ${gridCols} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

export default ResponsiveGrid
