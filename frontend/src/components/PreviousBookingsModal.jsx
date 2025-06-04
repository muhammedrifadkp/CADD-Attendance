import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ComputerDesktopIcon,
  ClockIcon,
  UserIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { formatDateLong } from '../utils/dateUtils'

const PreviousBookingsModal = ({ isOpen, onClose, previousBookings, previousDate }) => {
  const timeSlots = [
    '09:00 AM - 10:30 AM',
    '10:30 AM - 12:00 PM',
    '12:00 PM - 01:30 PM',
    '02:00 PM - 03:30 PM',
    '03:30 PM - 05:00 PM'
  ]

  const getTimeSlotLabel = (slot) => {
    const [start, end] = slot.split('-')
    return `${start} - ${end}`
  }

  const getBookingsForTimeSlot = (timeSlot) => {
    return previousBookings.filter(booking => booking.timeSlot === timeSlot)
  }

  const getPCStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold leading-6 text-gray-900"
                    >
                      Previous Day Bookings
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-600">
                      <CalendarDaysIcon className="inline h-4 w-4 mr-1" />
                      {previousDate ? formatDateLong(new Date(previousDate)) : 'Yesterday'}
                      <span className="ml-4 text-cadd-red font-medium">
                        Total Bookings: {previousBookings.length}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cadd-red focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto">
                  {previousBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Previous Bookings</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No bookings were found for the previous day.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {timeSlots.map((timeSlot) => {
                        const slotBookings = getBookingsForTimeSlot(timeSlot)
                        
                        return (
                          <div key={timeSlot} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center mb-4">
                              <ClockIcon className="h-5 w-5 text-cadd-red mr-2" />
                              <h4 className="text-lg font-semibold text-gray-900">
                                {getTimeSlotLabel(timeSlot)}
                              </h4>
                              <span className="ml-auto bg-cadd-red text-white px-3 py-1 rounded-full text-sm font-medium">
                                {slotBookings.length} booking{slotBookings.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {slotBookings.length === 0 ? (
                              <p className="text-gray-500 text-sm italic">No bookings for this time slot</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {slotBookings.map((booking) => (
                                  <div
                                    key={booking._id}
                                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                  >
                                    {/* PC Info */}
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center">
                                        <ComputerDesktopIcon className="h-5 w-5 text-cadd-purple mr-2" />
                                        <span className="font-semibold text-gray-900">
                                          {booking.pc?.pcNumber || 'Unknown PC'}
                                        </span>
                                      </div>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPCStatusColor(booking.pc?.status)}`}>
                                        Row {booking.pc?.rowNumber || 'N/A'}
                                      </span>
                                    </div>

                                    {/* Student Info */}
                                    <div className="space-y-2">
                                      <div className="flex items-center">
                                        <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                                        <span className="text-sm text-gray-900 font-medium">
                                          {booking.studentName || booking.bookedFor || 'Unknown Student'}
                                        </span>
                                      </div>
                                      
                                      {booking.teacherName && (
                                        <div className="flex items-center">
                                          <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-2" />
                                          <span className="text-sm text-gray-600">
                                            Teacher: {booking.teacherName}
                                          </span>
                                        </div>
                                      )}

                                      {booking.purpose && (
                                        <div className="flex items-center">
                                          <BuildingOfficeIcon className="h-4 w-4 text-gray-500 mr-2" />
                                          <span className="text-sm text-gray-600">
                                            {booking.purpose}
                                          </span>
                                        </div>
                                      )}

                                      {booking.bookedBy && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                          <span className="text-xs text-gray-500">
                                            Booked by: {booking.bookedBy.name || booking.bookedBy.email}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-cadd-red px-4 py-2 text-sm font-medium text-white hover:bg-cadd-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-cadd-red focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Close
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

export default PreviousBookingsModal
