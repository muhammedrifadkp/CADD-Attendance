import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  UserIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { formatDateLong } from '../utils/dateUtils'

const ApplyPreviousBookingsModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  previousBookings, 
  selectedDate, 
  loading 
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const timeSlots = [
    '09:00-10:30',
    '10:30-12:00',
    '12:00-13:30',
    '14:00-15:30',
    '15:30-17:00'
  ]

  const getTimeSlotLabel = (slot) => {
    const [start, end] = slot.split('-')
    return `${start} - ${end}`
  }

  const getBookingsForTimeSlot = (timeSlot) => {
    return previousBookings.filter(booking => booking.timeSlot === timeSlot)
  }

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-bold leading-6 text-gray-900"
                      >
                        Apply Previous Bookings
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-600">
                        This will copy yesterday's bookings to {formatDateLong(new Date(selectedDate))}
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
                  {previousBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Previous Bookings</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No bookings were found for yesterday to apply.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-900">
                              Ready to Apply {previousBookings.length} Booking{previousBookings.length !== 1 ? 's' : ''}
                            </h4>
                            <p className="text-sm text-blue-700 mt-1">
                              These bookings will be copied to the selected date with the same time slots and student assignments.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Warning */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-amber-900">Important Notes</h4>
                            <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                              <li>Existing bookings for the same PC and time slot will not be overwritten</li>
                              <li>Only active PCs will be booked</li>
                              <li>Conflicts will be reported after processing</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Details */}
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center text-sm text-cadd-red hover:text-cadd-pink font-medium mb-4"
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {showDetails ? 'Hide' : 'Show'} Booking Details
                      </button>

                      {/* Booking Details */}
                      {showDetails && (
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                          <div className="space-y-4">
                            {timeSlots.map((timeSlot) => {
                              const slotBookings = getBookingsForTimeSlot(timeSlot)
                              
                              if (slotBookings.length === 0) return null

                              return (
                                <div key={timeSlot} className="border-b border-gray-100 pb-3 last:border-b-0">
                                  <h5 className="font-medium text-gray-900 mb-2">
                                    {getTimeSlotLabel(timeSlot)} ({slotBookings.length} booking{slotBookings.length !== 1 ? 's' : ''})
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {slotBookings.map((booking, index) => (
                                      <div key={index} className="flex items-center text-sm text-gray-600">
                                        <ComputerDesktopIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="font-medium">{booking.pc?.pcNumber}</span>
                                        <UserIcon className="h-4 w-4 ml-2 mr-1 text-gray-400" />
                                        <span>{booking.studentName || booking.bookedFor}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-cadd-red px-4 py-2 text-sm font-medium text-white hover:bg-cadd-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-cadd-red focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleConfirm}
                    disabled={loading || previousBookings.length === 0}
                  >
                    {loading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Apply Bookings
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ApplyPreviousBookingsModal
