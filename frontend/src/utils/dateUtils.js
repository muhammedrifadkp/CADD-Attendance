// Date utility functions for consistent DD/MM/YYYY formatting
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  }
  
  return new Date(date).toLocaleDateString('en-GB', defaultOptions)
}

export const formatDateLong = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateSimple = (date) => {
  return new Date(date).toLocaleDateString('en-GB')
}
