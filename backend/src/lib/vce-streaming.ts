/**
 * VibeForge Cognitive Engine - SSE Streaming Handler
 * Manages Server-Sent Events transport for real-time communication
 */

import type { StreamingEvent, TextChunk, Role } from "../types/vce";

export class SSEStream {
  private encoder: TextEncoder;
  private keepaliveInterval: NodeJS.Timeout | null = null;
  private writable: WritableStream<string>;
  private closed = false;

  constructor(writable: WritableStream<string>) {
    this.encoder = new TextEncoder();
    this.writable = writable;
  }

  /**
   * Send a JSON event as SSE
   */
  async sendEvent(type: string, data: unknown): Promise<void> {
    if (this.closed) return;

    const event: StreamingEvent = {
      type: type as any,
      data,
      timestamp: Date.now(),
    };

    const eventString = `event: ${type}\ndata: ${JSON.stringify(event.data)}\n\n`;

    try {
      const writer = this.writable.getWriter();
      await writer.write(eventString);
      writer.releaseLock();
    } catch (err) {
      this.closed = true;
      console.error("SSE write error:", err);
    }
  }

  /**
   * Send a status update
   */
  async sendStatus(status: string): Promise<void> {
    await this.sendEvent("status", { phase: status, timestamp: Date.now() });
  }

  /**
   * Send a text delta (streaming chunk)
   */
  async sendDelta(taskId: string, role: Role, delta: string): Promise<void> {
    const chunk: TextChunk = { taskId, role, delta };
    await this.sendEvent("delta", chunk);
  }

  /**
   * Send route decision
   */
  async sendRoute(routeDecision: unknown): Promise<void> {
    await this.sendEvent("route", routeDecision);
  }

  /**
   * Send final fused output
   */
  async sendFinal(output: unknown): Promise<void> {
    await this.sendEvent("final", output);
  }

  /**
   * Send an error
   */
  async sendError(message: string, code?: string): Promise<void> {
    await this.sendEvent("error", { message, code, timestamp: Date.now() });
  }

  /**
   * Start keepalive pings (prevents proxies from buffering/closing)
   */
  startKeepalive(intervalMs: number = 15000): void {
    this.keepaliveInterval = setInterval(async () => {
      if (!this.closed) {
        try {
          const writer = this.writable.getWriter();
          await writer.write(":keepalive\n\n");
          writer.releaseLock();
        } catch {
          this.closed = true;
          if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop keepalive
   */
  stopKeepalive(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  /**
   * Close the stream
   */
  async close(): Promise<void> {
    this.stopKeepalive();
    this.closed = true;
    try {
      await this.writable.close();
    } catch (err) {
      console.error("Error closing SSE stream:", err);
    }
  }

  /**
   * Check if stream is still open
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Create SSE response for a fetch handler
 * Usage: return createSSEResponse((stream) => {...your logic...})
 */
export function createSSEResponse(handler: (stream: SSEStream) => Promise<void>): Response {
  let controller: ReadableStreamDefaultController<string>;

  const readable = new ReadableStream<string>({
    start(c) {
      controller = c;
    },
  });

  const writable = new WritableStream<string>({
    write(chunk) {
      controller.enqueue(chunk);
    },
    close() {
      controller.close();
    },
    abort(err) {
      controller.error(err);
    },
  });

  const sseStream = new SSEStream(writable);

  // Run handler in background
  handler(sseStream).catch((err) => {
    console.error("SSE handler error:", err);
    sseStream.sendError("Internal server error").catch(() => {});
    sseStream.close().catch(() => {});
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}

export default SSEStream;
