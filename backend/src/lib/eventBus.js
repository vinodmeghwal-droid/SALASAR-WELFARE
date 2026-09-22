import { EventEmitter } from 'node:events';

/**
 * In-process pub/sub between the sync service and SSE clients.
 * Events: "sync:started", "sync:completed", "sync:failed".
 * For multi-instance deployments swap this for Redis pub/sub or MongoDB change streams.
 */
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(500);
