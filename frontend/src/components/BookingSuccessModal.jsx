import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { CheckCircleIcon, CalendarDaysIcon, ComputerDesktopIcon, ClockIcon } from '@heroicons/react/24/outline'
import { formatDateSimple } from '../utils/dateUtils'

const BookingSuccessModal = ({ isOpen, onClose, bookingDetails }) => {
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <div className="text-center">
                  {/* Success Icon */}
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-bounce-in">
                    <CheckCircleIcon className="h-10 w-10 text-green-600" />
                  </div>

                  {/* Success Message */}
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900 mb-2"
                  >
                    Booking Confirmed! 🎉
                  </Dialog.Title>
                  <p className="text-gray-600 mb-6">
                    Your lab session has been successfully booked.
                  </p>

                  {/* Booking Details */}
                  {bookingDetails && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                      <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDateSimple(bookingDetails.date)}
                            </p>
                            <p className="text-xs text-gray-500">{bookingDetails.timeSlot}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <ComputerDesktopIcon className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              PC {bookingDetails.pcNumber}
                            </p>
                            <p className="text-xs text-gray-500">Row {bookingDetails.rowNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {bookingDetails.bookedFor}
                            </p>
                            <p className="text-xs text-gray-500">{bookingDetails.purpose}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                      onClick={() => window.print()}
                    >
                      Print Details
                    </button>
                    <button
                      type="button"
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
                      onClick={onClose}
                    >
                      Continue
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          onClose()
                          window.location.href = '/todays-bookings'
                        }}
                      >
                        View Bookings
                      </button>
                      <button
                        type="button"
                        className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          onClose()
                          window.location.href = '/book-lab'
                        }}
                      >
                        Book Another
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default BookingSuccessModal
