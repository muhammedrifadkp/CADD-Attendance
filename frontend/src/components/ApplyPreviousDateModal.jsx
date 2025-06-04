import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, CalendarDaysIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

const ApplyPreviousDateModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  targetDate,
  loading 
}) => {
  const [selectedDate, setSelectedDate] = useState('')

  const handleConfirm = () => {
    if (!selectedDate) {
      return
    }
    onConfirm(selectedDate)
  }

  const formatDateLong = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900"
                  >
                    Apply Previous Bookings
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-600">
                    Select which date to copy bookings from
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cadd-red focus:ring-offset-2"
                onClick={onClose}
                disabled={loading}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              {/* Target Date Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Target Date
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Bookings will be copied to: <strong>{formatDateLong(new Date(targetDate))}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="source-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Select source date to copy from:
                  </label>
                  <input
                    id="source-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={today}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    disabled={loading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Select a date from which to copy all bookings. Only past dates and today are allowed.
                  </p>
                </div>

                {selectedDate && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-900">
                          Ready to Copy
                        </h4>
                        <p className="text-sm text-green-700">
                          Copy bookings from <strong>{formatDateLong(new Date(selectedDate))}</strong> to <strong>{formatDateLong(new Date(targetDate))}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-900">Important Notes</h4>
                    <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                      <li>Existing bookings for the same PC and time slot will not be overwritten</li>
                      <li>Only active PCs will be booked</li>
                      <li>Conflicts will be reported after processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                onClick={handleConfirm}
                disabled={loading || !selectedDate}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Apply Bookings
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default ApplyPreviousDateModal
