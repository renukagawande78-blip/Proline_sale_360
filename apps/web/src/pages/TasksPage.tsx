import React from 'react';
import { TasksView } from '../modules/tasks/TasksView';
import { TaskItem, TaskStatus, TaskAttachment, User } from '../types';

interface TasksPageProps {
  tasks: TaskItem[];
  users: User[];
  onOpenCreateTask: () => void;
  onSelectTask: (task: TaskItem) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus, remarks?: string, proofDocs?: TaskAttachment[]) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onRefreshTasks?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = (props) => {
  return <TasksView {...props} />;
};
