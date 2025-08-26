/**
 * Simple concurrency limiter for managing concurrent operations
 */
export class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => Promise<any>> = [];
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Add a task to the pool and execute it when a slot is available
   * @param task - Function that returns a promise
   * @returns Promise that resolves when the task completes
   */
  async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };

      this.queue.push(wrappedTask);
      this.processQueue();
    });
  }

  /**
   * Process the queue if there are available slots
   */
  private processQueue(): void {
    while (this.running < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }

  /**
   * Wait for all running tasks to complete
   */
  async waitForAll(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Get current pool status
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrency: this.maxConcurrency
    };
  }
} 