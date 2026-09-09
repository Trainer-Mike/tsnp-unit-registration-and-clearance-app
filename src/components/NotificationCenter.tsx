import React, { useState, useRef, useEffect } from 'react';
import { InAppNotification, User, Registration } from '../types';
import { StorageService, triggerStoreUpdate } from '../services/storage';
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, X } from 'lucide-react';

interface NotificationCenterProps {
  notifications: InAppNotification[];
  currentUser?: User;
  registrations?: Registration[];
  onOpenRegistration?: (registrationId: string) => void;
  onSelectRegistration?: (registrationId: string) => void;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  currentUser,
  registrations,
  onOpenRegistration,
  onSelectRegistration,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications specifically targeted for the current logged-in user persona
  const filteredNotifications = notifications.filter((n) => {
    return StorageService.isNotificationForUser(n, currentUser, registrations);
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    StorageService.markAllNotificationsRead(currentUser);
    triggerStoreUpdate();
  };

  const handleNotificationClick = (item: InAppNotification) => {
    StorageService.markNotificationRead(item.id);
    const callback = onOpenRegistration || onSelectRegistration;
    if (item.linkRegistrationId && callback) {
      callback(item.linkRegistrationId);
      handleClose();
    }
  };

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={handleToggle}
        title="View Notifications"
        aria-label="View notifications"
        aria-expanded={isOpen}
        className={`relative p-2 rounded-xl border transition flex items-center justify-center ${
          isOpen
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 z-50 overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-emerald-500 text-slate-950 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                  className="text-xs text-slate-400 hover:text-emerald-300 hover:underline flex items-center gap-1 transition"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark read
                </button>
              )}
              <button
                id="close-notifications-x-btn"
                onClick={handleClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Close notifications window"
                aria-label="Close notifications window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of notifications */}
          <div className="max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="font-medium text-slate-300">No notifications yet</p>
                <p className="text-xs text-slate-500 mt-1">Updates on approvals and submissions will appear here.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 hover:bg-slate-800/60 transition cursor-pointer flex gap-3 items-start ${
                    !n.read ? 'bg-emerald-950/20' : ''
                  }`}
                >
                  {getIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-xs font-semibold ${!n.read ? 'text-white font-bold' : 'text-slate-300'}`}>
                        {n.title}
                      </h4>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1.5 shadow-xs shadow-emerald-400" />}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.linkRegistrationId && (
                        <span className="text-emerald-400 font-medium flex items-center gap-0.5 hover:underline">
                          View record <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with clear Close Button */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-center">
            <button
              id="close-notifications-bottom-btn"
              onClick={handleClose}
              className="w-full text-xs text-slate-300 hover:text-white font-semibold py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
            >
              Close Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
