// ============================================================================
// Collaboration Utilities - Stage 12 Step 6
// Real-time collaboration infrastructure for icon creator
// ============================================================================

import {
    User,
    UserPresence,
    CollaborationSession,
    CollaborationState,
    ChangeOperation,
    ConflictResolution,
    CollaborationMessage,
    OperationalTransform,
    VersionControl,
    CollaborationSettings,
} from "../types/editor";

/**
 * WebSocket connection manager for real-time collaboration
 */
export class CollaborationConnection {
    private ws: WebSocket | null = null;
    private url: string;
    private sessionId: string;
    private userId: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private messageQueue: CollaborationMessage[] = [];
    private isConnected = false;

    // Event handlers
    private onConnect: (() => void) | null = null;
    private onDisconnect: (() => void) | null = null;
    private onMessage: ((message: CollaborationMessage) => void) | null = null;
    private onError: ((error: Error) => void) | null = null;

    constructor(url: string, sessionId: string, userId: string) {
        this.url = url;
        this.sessionId = sessionId;
        this.userId = userId;
    }

    /**
     * Connect to collaboration server
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(`${this.url}?sessionId=${this.sessionId}&userId=${this.userId}`);

                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.flushMessageQueue();
                    this.onConnect?.();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: CollaborationMessage = JSON.parse(event.data);
                        this.onMessage?.(message);
                    } catch (error) {
                        console.error("Failed to parse message:", error);
                    }
                };

                this.ws.onclose = () => {
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.onDisconnect?.();
                    this.attemptReconnect();
                };

                this.ws.onerror = (error) => {
                    const err = new Error(`WebSocket error: ${error}`);
                    this.onError?.(err);
                    reject(err);
                };

                // Connection timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        this.ws?.close();
                        reject(new Error("Connection timeout"));
                    }
                }, 10000);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Disconnect from collaboration server
     */
    disconnect(): void {
        this.isConnected = false;
        this.stopHeartbeat();
        this.clearReconnectTimeout();
        this.ws?.close();
        this.ws = null;
    }

    /**
     * Send message to collaboration server
     */
    send(message: CollaborationMessage): void {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            // Queue message for later sending
            this.messageQueue.push(message);
        }
    }

    /**
     * Set event handlers
     */
    onConnectionOpen(handler: () => void): void {
        this.onConnect = handler;
    }

    onConnectionClose(handler: () => void): void {
        this.onDisconnect = handler;
    }

    onMessageReceived(handler: (message: CollaborationMessage) => void): void {
        this.onMessage = handler;
    }

    onConnectionError(handler: (error: Error) => void): void {
        this.onError = handler;
    }

    /**
     * Get connection status
     */
    getConnectionStatus(): "disconnected" | "connecting" | "connected" | "error" {
        if (!this.ws) return "disconnected";

        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return "connecting";
            case WebSocket.OPEN:
                return "connected";
            case WebSocket.CLOSING:
            case WebSocket.CLOSED:
                return "disconnected";
            default:
                return "error";
        }
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({
                    id: `heartbeat-${Date.now()}`,
                    type: "sync",
                    timestamp: Date.now(),
                    userId: this.userId,
                    sessionId: this.sessionId,
                    data: { type: "heartbeat" },
                });
            }
        }, 30000); // 30 seconds
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.send(message);
            }
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            this.reconnectTimeout = setTimeout(() => {
                this.reconnectAttempts++;
                this.connect().catch(() => {
                    // Reconnection failed, will try again
                });
            }, delay);
        }
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}

/**
 * Operational transformation utilities for conflict resolution
 */
export class OperationalTransformation {
    /**
     * Transform an operation against another concurrent operation
     */
    static transform(op1: ChangeOperation, op2: ChangeOperation): OperationalTransform {
        const result: OperationalTransform = {
            id: `transform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            operation: op1,
            context: [op2],
            transformed: { ...op1 },
            priority: this.calculatePriority(op1, op2),
            isValid: true,
        };

        try {
            // Apply transformation rules based on operation types
            result.transformed = this.transformByType(op1, op2);
            result.isValid = this.validateTransformation(result.transformed);
        } catch (error) {
            console.error("Operational transformation failed:", error);
            result.isValid = false;
        }

        return result;
    }

    /**
     * Transform operation based on type-specific rules
     */
    private static transformByType(op1: ChangeOperation, op2: ChangeOperation): ChangeOperation {
        const transformed = { ...op1 };

        // Same object operations
        if (op1.objectId === op2.objectId) {
            // Handle concurrent edits on same object
            if (op1.type === "update" && op2.type === "update") {
                transformed.beforeValue = op2.afterValue; // Update base value
            }

            // Handle delete vs update conflicts
            if (op1.type === "update" && op2.type === "delete") {
                // Mark transformation as invalid by setting metadata
                transformed.metadata = { ...transformed.metadata, isInvalid: true };
            }

            if (op1.type === "delete" && op2.type === "update") {
                // Delete takes precedence over update
                return transformed;
            }
        }

        // Transform coordinates for move operations
        if (op1.type === "move" && op2.type === "move" && op1.objectId === op2.objectId) {
            // Apply relative transformation
            const op1Delta = this.getMoveDelta(op1);
            const op2Delta = this.getMoveDelta(op2);

            if (op1.timestamp > op2.timestamp) {
                // Apply op1's delta on top of op2's final position
                transformed.afterValue = {
                    x: (op2.afterValue?.x || 0) + op1Delta.x,
                    y: (op2.afterValue?.y || 0) + op1Delta.y,
                };
            }
        }

        // Transform layer operations
        if (op1.type === "move" && op2.type === "move" && op1.layerId === op2.layerId) {
            const op1Index = op1.afterValue?.index || 0;
            const op2Index = op2.afterValue?.index || 0;

            if (op1Index >= op2Index && op1.timestamp > op2.timestamp) {
                transformed.afterValue = { ...transformed.afterValue, index: op1Index + 1 };
            }
        }

        return transformed;
    }

    /**
     * Calculate operation priority for conflict resolution
     */
    private static calculatePriority(op1: ChangeOperation, op2: ChangeOperation): number {
        let priority = 0;

        // Timestamp-based priority (later operations have higher priority)
        priority += op1.timestamp > op2.timestamp ? 10 : 0;

        // Operation type priority
        const typePriority: Record<string, number> = {
            delete: 100,
            create: 90,
            move: 70,
            transform: 60,
            update: 50,
            style: 40,
        };

        priority += typePriority[op1.type] || 0;

        // User role priority (could be implemented with user context)
        // priority += op1.userId === "owner" ? 20 : 0;

        return priority;
    }

    /**
     * Validate that transformation result is valid
     */
    private static validateTransformation(operation: ChangeOperation): boolean {
        try {
            // Check required fields
            if (!operation.id || !operation.type || !operation.userId) {
                return false;
            }

            // Validate operation-specific data
            switch (operation.type) {
                case "create":
                    return !!operation.afterValue && !!operation.objectId;
                case "update":
                    return (
                        !!operation.objectId &&
                        operation.beforeValue !== undefined &&
                        operation.afterValue !== undefined
                    );
                case "delete":
                    return !!operation.objectId;
                case "move":
                    return !!operation.objectId || !!operation.layerId;
                default:
                    return true;
            }
        } catch {
            return false;
        }
    }

    /**
     * Get movement delta from move operation
     */
    private static getMoveDelta(operation: ChangeOperation): { x: number; y: number } {
        const before = operation.beforeValue || { x: 0, y: 0 };
        const after = operation.afterValue || { x: 0, y: 0 };

        return {
            x: after.x - before.x,
            y: after.y - before.y,
        };
    }
}

/**
 * Conflict resolution utilities
 */
export class ConflictResolver {
    /**
     * Resolve conflicts between operations
     */
    static resolveConflict(
        operations: ChangeOperation[],
        strategy: ConflictResolution["resolutionStrategy"] = "last-write-wins"
    ): ConflictResolution {
        const conflict: ConflictResolution = {
            id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            conflictingOperations: operations,
            resolutionStrategy: strategy,
            isResolved: false,
        };

        try {
            switch (strategy) {
                case "last-write-wins":
                    conflict.resolvedOperation = this.resolveLastWriteWins(operations);
                    break;
                case "auto-merge":
                    conflict.resolvedOperation = this.resolveAutoMerge(operations);
                    break;
                case "rollback":
                    conflict.resolvedOperation = this.resolveRollback(operations);
                    break;
                case "manual":
                    // Manual resolution requires user intervention
                    break;
            }

            conflict.isResolved = !!conflict.resolvedOperation;
        } catch (error) {
            console.error("Conflict resolution failed:", error);
        }

        return conflict;
    }

    /**
     * Resolve using last-write-wins strategy
     */
    private static resolveLastWriteWins(operations: ChangeOperation[]): ChangeOperation {
        return operations.reduce((latest, current) => (current.timestamp > latest.timestamp ? current : latest));
    }

    /**
     * Resolve using auto-merge strategy
     */
    private static resolveAutoMerge(operations: ChangeOperation[]): ChangeOperation {
        const base = operations[0];
        const merged = { ...base };

        // Merge properties from all operations
        for (let i = 1; i < operations.length; i++) {
            const op = operations[i];

            if (op.path && merged.afterValue && op.afterValue) {
                // Merge specific property paths
                const pathParts = op.path.split(".");
                let target = merged.afterValue;

                for (let j = 0; j < pathParts.length - 1; j++) {
                    target = target[pathParts[j]] = target[pathParts[j]] || {};
                }

                target[pathParts[pathParts.length - 1]] = op.afterValue;
            } else {
                // Full value merge (last write wins for conflicting properties)
                merged.afterValue = { ...merged.afterValue, ...op.afterValue };
            }
        }

        merged.id = `merged-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        merged.timestamp = Date.now();

        return merged;
    }

    /**
     * Resolve using rollback strategy
     */
    private static resolveRollback(operations: ChangeOperation[]): ChangeOperation {
        // Create a rollback operation that reverses all changes
        const rollback: ChangeOperation = {
            id: `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "update",
            timestamp: Date.now(),
            userId: "system",
            sessionId: "system",
            objectId: operations[0].objectId,
            beforeValue: operations[0].afterValue,
            afterValue: operations[0].beforeValue,
            metadata: {
                isRollback: true,
                originalOperations: operations.map((op) => op.id),
            },
        };

        return rollback;
    }
}

/**
 * User presence management utilities
 */
export class PresenceManager {
    private presence: Map<string, UserPresence> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private timeout = 60000; // 1 minute timeout

    constructor(timeout?: number) {
        if (timeout) this.timeout = timeout;
        this.startCleanupInterval();
    }

    /**
     * Update user presence
     */
    updatePresence(presence: UserPresence): void {
        presence.lastActivity = Date.now();
        presence.isActive = true;
        this.presence.set(presence.userId, presence);
    }

    /**
     * Remove user presence
     */
    removePresence(userId: string): void {
        this.presence.delete(userId);
    }

    /**
     * Get all active presence data
     */
    getAllPresence(): UserPresence[] {
        return Array.from(this.presence.values()).filter((p) => p.isActive);
    }

    /**
     * Get presence for specific user
     */
    getUserPresence(userId: string): UserPresence | undefined {
        return this.presence.get(userId);
    }

    /**
     * Check if user is active
     */
    isUserActive(userId: string): boolean {
        const presence = this.presence.get(userId);
        if (!presence) return false;

        const now = Date.now();
        return presence.isActive && now - presence.lastActivity < this.timeout;
    }

    /**
     * Cleanup inactive users
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [userId, presence] of this.presence.entries()) {
            if (now - presence.lastActivity > this.timeout) {
                presence.isActive = false;
            }
        }
    }

    /**
     * Start cleanup interval
     */
    private startCleanupInterval(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Stop cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

/**
 * Version control utilities for collaborative editing
 */
export class VersionManager {
    private versions: Map<string, VersionControl> = new Map();
    private currentVersion: string = "1.0.0";

    /**
     * Create new version
     */
    createVersion(authorId: string, message: string, operations: ChangeOperation[]): VersionControl {
        const version: VersionControl = {
            version: this.generateNextVersion(),
            timestamp: Date.now(),
            authorId,
            message,
            operations,
            parentVersion: this.currentVersion,
            isSnapshot: false,
        };

        this.versions.set(version.version, version);
        this.currentVersion = version.version;

        return version;
    }

    /**
     * Create snapshot version
     */
    createSnapshot(authorId: string, operations: ChangeOperation[]): VersionControl {
        const version = this.createVersion(authorId, "Auto-save snapshot", operations);
        version.isSnapshot = true;
        return version;
    }

    /**
     * Get version by version string
     */
    getVersion(version: string): VersionControl | undefined {
        return this.versions.get(version);
    }

    /**
     * Get current version
     */
    getCurrentVersion(): string {
        return this.currentVersion;
    }

    /**
     * Get version history
     */
    getVersionHistory(): VersionControl[] {
        return Array.from(this.versions.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Generate next semantic version
     */
    private generateNextVersion(): string {
        const parts = this.currentVersion.split(".").map(Number);
        parts[2]++; // Increment patch version
        return parts.join(".");
    }
}

/**
 * Main collaboration utilities class
 */
export class CollaborationUtils {
    private connection: CollaborationConnection | null = null;
    private presenceManager: PresenceManager;
    private versionManager: VersionManager;

    constructor() {
        this.presenceManager = new PresenceManager();
        this.versionManager = new VersionManager();
    }

    /**
     * Initialize collaboration connection
     */
    async connect(url: string, sessionId: string, userId: string): Promise<void> {
        this.connection = new CollaborationConnection(url, sessionId, userId);
        await this.connection.connect();
    }

    /**
     * Disconnect from collaboration
     */
    disconnect(): void {
        this.connection?.disconnect();
        this.connection = null;
    }

    /**
     * Get connection instance
     */
    getConnection(): CollaborationConnection | null {
        return this.connection;
    }

    /**
     * Get presence manager
     */
    getPresenceManager(): PresenceManager {
        return this.presenceManager;
    }

    /**
     * Get version manager
     */
    getVersionManager(): VersionManager {
        return this.versionManager;
    }

    /**
     * Generate unique operation ID
     */
    static generateOperationId(): string {
        return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique user ID
     */
    static generateUserId(): string {
        return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique session ID
     */
    static generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Create default collaboration state
     */
    static createDefaultCollaborationState(): CollaborationState {
        return {
            isEnabled: false,
            isConnected: false,
            isHost: false,
            connectionStatus: "disconnected",
            lastSync: 0,
            pendingOperations: [],
            operationHistory: [],
            conflicts: [],
            presenceIndicators: true,
            showCursors: true,
            showSelections: true,
        };
    }

    /**
     * Create default collaboration settings
     */
    static createDefaultCollaborationSettings(): CollaborationSettings {
        return {
            allowAnonymous: false,
            requireApproval: true,
            enableVoiceChat: false,
            enableTextChat: true,
            autoSaveInterval: 30,
            conflictResolution: "auto",
            presenceTimeout: 60000,
            operationTimeout: 10000,
        };
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.disconnect();
        this.presenceManager.destroy();
    }
}

export default CollaborationUtils;
