// Institute branding. Set these in frontend/.env.local (or your host's environment
// variables) to make the app your own; nothing else in the code needs to change.
const env = import.meta.env

export const BRAND = {
  // Full product name, shown in titles and reports
  appName: env.VITE_APP_NAME || 'Lab Attendance',
  // Your institute's full name, shown on the login page and in reports
  instituteName: env.VITE_INSTITUTE_NAME || 'Your Institute',
  // A short name or initials for headers and the splash screen (2-6 letters works best)
  shortName: env.VITE_INSTITUTE_SHORT_NAME || 'LAB',
  // Logo shown in headers: a path under frontend/public or a full URL
  logoUrl: env.VITE_LOGO_URL || '/logos/logo.svg',
}

export default BRAND
