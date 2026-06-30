import { io, Socket } from 'socket.io-client';
import { api } from './api';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return this.socket;

        // Always disconnect any stale socket first
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        const url = api.getBaseUrl();
        console.log('[Socket] Connecting to', url);

        this.socket = io(url, {
            // Start with polling (more reliable through proxies/Render CDN)
            // then upgrade to WebSocket — same strategy the mobile app uses
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected ✓ id:', this.socket?.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return this.socket;
    }

    /** Call this after the API base URL changes (e.g. from SettingsView). */
    reconnect() {
        console.log('[Socket] Reconnecting with new URL…');
        this.disconnect();
        const s = this.connect();
        // Re-attach any persistent listeners that were registered before
        return s;
    }

    onNewReport(callback: (report: any) => void) {
        this.socket?.on('new_report', callback);
    }

    onNewAlert(callback: (alert: any) => void) {
        this.socket?.on('new_alert', callback);
    }

    onNewUser(callback: (user: any) => void) {
        this.socket?.on('new_user', callback);
    }

    onNewSupportTicket(callback: (ticket: any) => void) {
        this.socket?.on('new_support_ticket', callback);
    }

    onNewPendingListing(callback: (listing: any) => void) {
        this.socket?.on('new_pending_listing', callback);
    }

    // Proactive Alert Simulator Disabled
    startProactiveSimulation() {}

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
