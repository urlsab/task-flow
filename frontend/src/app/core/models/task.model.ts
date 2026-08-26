export enum TaskStatus {
  Todo = 0,
  InProgress = 1,
  Review = 2,
  Done = 3
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  statusLabel: string;
  priority: TaskPriority;
  priorityLabel: string;
  dueDate: string | null;
  projectId: number;
  projectName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  projectId: number;
  assigneeId?: number | null;
  priority: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number | null;
  dueDate?: string | null;
}

export interface TaskQueryParams {
  projectId: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  assigneeId?: number;
}
