import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { notificationsAPI } from '../../services/api'

const NotificationCenter = ({ unreadCount, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getNotifications({ 
        limit: showAll ? 20 : 5,
        unreadOnly: false 
      })
      setNotifications(response.data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, readBy: [...(notif.readBy || []), { user: 'current_user', readAt: new Date() }] }
            : notif
        )
      )
      if (onUnreadCountChange) {
        onUnreadCountChange(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          readBy: [...(notif.readBy || []), { user: 'current_user', readAt: new Date() }] 
        }))
      )
      if (onUnreadCountChange) {
        onUnreadCountChange(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type, priority) => {
    const iconClass = "h-5 w-5"
    
    switch (type) {
      case 'error':
      case 'security':
        return <ExclamationTriangleIcon className={`${iconClass} text-red-500`} />
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-500`} />
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClass} text-blue-500`} />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'medium':
        return 'border-l-blue-500 bg-blue-50'
      case 'low':
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const isUnread = (notification) => {
    return !notification.readBy || notification.readBy.length === 0
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg">
              <BellIcon className="h-5 w-5 text-white" />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-cadd-red hover:text-cadd-pink font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
          <Link
            to="/admin/notifications"
            className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, showAll ? notifications.length : 5).map((notification) => (
            <div
              key={notification._id}
              className={`relative flex items-start space-x-3 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${
                isUnread(notification) 
                  ? `${getPriorityColor(notification.priority)} border-opacity-100` 
                  : 'bg-white border-l-gray-200 border-opacity-50'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type, notification.priority)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isUnread(notification) ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.priority === 'urgent' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                      {notification.priority === 'high' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          High
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isUnread(notification) && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Mark as read"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {isUnread(notification) && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-cadd-red rounded-full"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Show More/Less Button */}
      {notifications.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-cadd-red hover:text-cadd-pink font-medium transition-colors"
          >
            {showAll ? 'Show less' : `Show ${notifications.length - 5} more`}
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
