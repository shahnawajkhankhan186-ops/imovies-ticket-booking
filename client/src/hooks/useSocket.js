import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

/**
 * Socket.io hook for show-specific seat state updates with a polling fallback.
 * @param {string} showId
 * @param {Object} eventHandlers - { onSeatsHeld, onSeatsReleased, onSeatsBooked, onPollRefresh }
 */
export function useSocket(showId, eventHandlers = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!showId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:show', showId);
    });

    if (eventHandlers.onSeatsHeld) {
      socket.on('seats:held', eventHandlers.onSeatsHeld);
    }
    if (eventHandlers.onSeatsReleased) {
      socket.on('seats:released', eventHandlers.onSeatsReleased);
    }
    if (eventHandlers.onSeatsBooked) {
      socket.on('seats:booked', eventHandlers.onSeatsBooked);
    }

    // 10s Polling fallback to guarantee state synchronization
    const pollInterval = setInterval(() => {
      if (eventHandlers.onPollRefresh) {
        eventHandlers.onPollRefresh();
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.emit('leave:show', showId);
        socket.disconnect();
      }
    };
  }, [showId]);

  return socketRef.current;
}
