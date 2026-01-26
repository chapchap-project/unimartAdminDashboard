import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3000'; // Adjust as needed

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
            // Also listen to internal simulation for demo
            this.socket.on('simulate_alert', callback);
        }
    }

    // Proactive Alert Simulator for Demo
    startProactiveSimulation() {
        const scenarios = [
            { type: 'FRAUD', severity: 'CRITICAL', message: 'Pattern match: Multiple high-value electronics from same IP.' },
            { type: 'SPIKE', severity: 'WARNING', message: 'Message volume in Furniture category exceeded 2SD from mean.' },
            { type: 'PAYMENT', severity: 'CRITICAL', message: 'Payment provider error: Batch refund failure for 12 transactions.' },
            { type: 'SYSTEM', severity: 'INFO', message: 'New seller "StudentHero" listed 4 premium items in < 5 minutes.' },
            { type: 'REPORT', severity: 'WARNING', message: 'User Sarah Connor received 3 reports in the last hour.' }
        ];

        let index = 0;
        setInterval(() => {
            if (this.socket && this.socket.connected) {
                const scenario = scenarios[index % scenarios.length];
                const newAlert = {
                    ...scenario,
                    id: `sim-${Date.now()}`,
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString()
                };

                // Emulate server emitting to client
                this.socket.emit('simulate_alert', newAlert);
                index++;
            }
        }, 60000); // Surface something every 1 minute
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
