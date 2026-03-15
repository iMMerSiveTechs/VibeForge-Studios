/**
 * VibeForge Cognitive Engine - Task Runtime
 * Manages concurrent task execution, streaming, and interrupts
 */

import { randomUUID } from "crypto";
import type { Task, Priority, Role } from "../types/vce";

export class TaskRuntime {
  private tasks: Map<string, Task> = new Map();
  private tasksByTurn: Map<string, string[]> = new Map(); // turnId → [taskIds]

  /**
   * Create a new task for a specific role
   */
  createTask(turnId: string, role: Role, priority: Priority = "MED"): Task {
    const task: Task = {
      id: randomUUID(),
      turnId,
      role,
      priority,
      status: "pending",
      abortController: new AbortController(),
      streamBuffer: [],
      result: null,
      error: null,
      createdAt: Date.now(),
    };

    this.tasks.set(task.id, task);

    // Track tasks by turn for easy batch operations
    const turnTasks = this.tasksByTurn.get(turnId) || [];
    turnTasks.push(task.id);
    this.tasksByTurn.set(turnId, turnTasks);

    return task;
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks for a turn
   */
  getTasksForTurn(turnId: string): Task[] {
    const taskIds = this.tasksByTurn.get(turnId) || [];
    return taskIds.map((id) => this.tasks.get(id)!).filter(Boolean);
  }

  /**
   * Mark a task as running
   */
  markRunning(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "running";
      task.startedAt = Date.now();
    }
  }

  /**
   * Stream a delta into a task's buffer
   */
  streamDelta(taskId: string, delta: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === "running") {
      task.status = "streaming";
      task.streamBuffer.push(delta);
    }
  }

  /**
   * Complete a task with result
   */
  completeTask(taskId: string, result: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.result = result;
      task.status = "done";
      task.completedAt = Date.now();
    }
  }

  /**
   * Fail a task with error
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.error = error;
      task.status = "error";
      task.completedAt = Date.now();
    }
  }

  /**
   * Cancel a task by aborting its controller
   */
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status !== "done" && task.status !== "error") {
      task.abortController.abort();
      task.status = "cancelled";
      task.completedAt = Date.now();
    }
  }

  /**
   * Interrupt a turn: cancel all MED/LOW priority tasks, keep HIGH
   */
  interruptTurn(turnId: string): void {
    const turnTasks = this.tasksByTurn.get(turnId) || [];
    for (const taskId of turnTasks) {
      const task = this.tasks.get(taskId)!;
      if (task.priority !== "HIGH" && task.status !== "done" && task.status !== "error") {
        this.cancelTask(taskId);
      }
    }
  }

  /**
   * Cancel all tasks for a turn (stop button)
   */
  cancelTurn(turnId: string): void {
    const turnTasks = this.tasksByTurn.get(turnId) || [];
    for (const taskId of turnTasks) {
      this.cancelTask(taskId);
    }
  }

  /**
   * Get all high-priority tasks that are not done
   */
  getPendingHighPriorityTasks(turnId: string): Task[] {
    const turnTasks = this.tasksByTurn.get(turnId) || [];
    return turnTasks
      .map((id) => this.tasks.get(id)!)
      .filter((t) => t.priority === "HIGH" && (t.status === "pending" || t.status === "running" || t.status === "streaming"));
  }

  /**
   * Get completed tasks for a turn
   */
  getCompletedTasks(turnId: string): Task[] {
    const turnTasks = this.tasksByTurn.get(turnId) || [];
    return turnTasks
      .map((id) => this.tasks.get(id)!)
      .filter((t) => t.status === "done" || t.status === "error");
  }

  /**
   * Wait for all HIGH tasks to complete or timeout
   */
  async waitForHighPriorityTasks(turnId: string, timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const pending = this.getPendingHighPriorityTasks(turnId);
      if (pending.length === 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Collect final results from all tasks (buffer joined)
   */
  collectTaskResults(turnId: string): Map<string, string> {
    const results = new Map<string, string>();
    const turnTasks = this.tasksByTurn.get(turnId) || [];

    for (const taskId of turnTasks) {
      const task = this.tasks.get(taskId)!;
      const finalResult = task.result || task.streamBuffer.join("");
      if (finalResult) {
        results.set(task.role, finalResult);
      }
    }

    return results;
  }

  /**
   * Clean up a turn's tasks (memory management)
   */
  cleanupTurn(turnId: string): void {
    const taskIds = this.tasksByTurn.get(turnId) || [];
    for (const taskId of taskIds) {
      this.tasks.delete(taskId);
    }
    this.tasksByTurn.delete(turnId);
  }

  /**
   * Get metrics for debugging
   */
  getMetrics(turnId: string) {
    const tasks = this.getTasksForTurn(turnId);
    return {
      totalTasks: tasks.length,
      completed: tasks.filter((t) => t.status === "done").length,
      errored: tasks.filter((t) => t.status === "error").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      totalInputTokens: 0, // placeholder
      totalOutputTokens: 0, // placeholder
      durationMs: tasks.length > 0
        ? Math.max(...tasks.map((t) => t.completedAt || 0)) - Math.min(...tasks.map((t) => t.createdAt))
        : 0,
    };
  }
}

export default TaskRuntime;
