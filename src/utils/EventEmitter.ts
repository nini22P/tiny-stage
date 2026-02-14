export type EventMap = Record<string, unknown[]>;

export type EventCallback<T extends unknown[]> = (...args: T) => void;

export class EventEmitter<T extends EventMap = EventMap> {
  private events = new Map<keyof T, Set<EventCallback<never[]>>>()

  public on<K extends keyof T>(event: K, callback: EventCallback<T[K]>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback as unknown as EventCallback<never[]>)
    return () => this.off(event, callback)
  }

  public once<K extends keyof T>(event: K, callback: EventCallback<T[K]>): () => void {
    const wrappedCallback = (...args: T[K]) => {
      callback(...args)
      this.off(event, wrappedCallback as unknown as EventCallback<T[K]>)
    }
    return this.on(event, wrappedCallback as unknown as EventCallback<T[K]>)
  }

  public off<K extends keyof T>(event: K, callback: EventCallback<T[K]>): void {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.delete(callback as unknown as EventCallback<never[]>)
      if (listeners.size === 0) {
        this.events.delete(event)
      }
    }
  }

  public emit<K extends keyof T>(event: K, ...args: T[K]): void {
    this.events.get(event)?.forEach(cb => {
      try {
        (cb as unknown as EventCallback<T[K]>)(...args)
      } catch (error) {
        console.error(`[Event Emitter] Error in handler for "${String(event)}":`, error)
      }
    })
  }

  public clearEvent<K extends keyof T>(event: K): void {
    this.events.delete(event)
  }

  public clear(): void {
    this.events.clear()
  }

  public listenerCount<K extends keyof T>(event: K): number {
    return this.events.get(event)?.size ?? 0
  }
}