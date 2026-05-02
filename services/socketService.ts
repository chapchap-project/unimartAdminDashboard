import { io, Socket } from 'socket.io-client';

const BACKEND_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(BACKEND_URL);

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
