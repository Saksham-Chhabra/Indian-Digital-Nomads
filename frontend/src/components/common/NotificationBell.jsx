"use client";
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '@/lib/api';
import Link from 'next/link';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/api/v1/user/notifications');
        if (response.data.success) {
          setNotifications(response.data.data.notifications);
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();

    // 2. Connect to Socket.io
    const socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    socket.on('notification', (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // 3. Handle click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch('/api/v1/user/notifications', { notificationId: id });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/v1/user/notifications', {});
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-outline hover:bg-surface-container-low rounded-full transition-colors"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100]">
          <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface">Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors cursor-pointer relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`}></div>
                    <div className="flex-1">
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-on-surface' : 'text-on-surface-variant font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-outline mt-1 font-bold" suppressHydrationWarning>
                        {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {n.link && (
                        <Link 
                          href={n.link}
                          className="mt-2 inline-block text-[11px] font-black text-primary uppercase tracking-tighter hover:underline"
                          onClick={() => setIsOpen(false)}
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">notifications_off</span>
                <p className="text-sm font-bold text-outline">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
