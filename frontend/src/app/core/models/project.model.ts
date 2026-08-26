export interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  ownerName: string;
  createdAt: string;
  taskCount: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
}

export interface ProjectStats {
  projectId: number;
  projectName: string;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  doneCount: number;
  overdueTasks: number;
}
