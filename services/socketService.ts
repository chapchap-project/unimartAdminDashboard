import { io, Socket } from 'socket.io-client';
import { api } from './api';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            // Use the same base URL the API service is configured to use,
            // which may be overridden via localStorage in the Settings view.
            this.socket = io(api.getBaseUrl());

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
            });
        }
        return this.socket;
    }

    onNewReport(callback: (report: any) => void) {
        if (this.socket) {
            this.socket.on('new_report', callback);
        }
    }

    onNewAlert(callback: (alert: any) => void) {
        if (this.socket) {
            this.socket.on('new_alert', callback);
        }
    }

    onNewUser(callback: (user: any) => void) {
        if (this.socket) {
            this.socket.on('new_user', callback);
        }
    }

    onNewSupportTicket(callback: (ticket: any) => void) {
        if (this.socket) {
            this.socket.on('new_support_ticket', callback);
        }
    }

    // Proactive Alert Simulator Disabled
    startProactiveSimulation() {
        // Disabled for production/real-backend mode
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
