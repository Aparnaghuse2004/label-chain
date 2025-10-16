"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTasks } from "@/hooks/use-tasks";
import {
  Search,
  Image as ImageIcon,
  FileText,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Archive,
  Trash2,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface TaskListProps {
  onTaskSelect?: (taskId: string) => void;
}

export function TaskList({ onTaskSelect }: TaskListProps) {
  const { tasks, updateTaskStatus, deleteTask } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLabelType, setFilterLabelType] = useState<string>("all");

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || task.status === filterStatus;
      const matchesLabelType =
        filterLabelType === "all" || task.labelType === filterLabelType;

      return matchesSearch && matchesStatus && matchesLabelType;
    });
  }, [tasks, searchQuery, filterStatus, filterLabelType]);

  const handleStatusChange = async (
    taskId: string,
    newStatus: "draft" | "active" | "completed" | "archived",
  ) => {
    try {
      await updateTaskStatus(taskId as Id<"tasks">, newStatus);
      toast.success(`Task status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteTask(taskId as Id<"tasks">);
        toast.success("Task deleted successfully");
      } catch {
        toast.error("Failed to delete task");
      }
    }
  };

  const tasksByStatus = React.useMemo(() => {
    if (!tasks) return { draft: [], active: [], completed: [], archived: [] };

    return tasks.reduce(
      (acc, task) => {
        acc[task.status as keyof typeof acc].push(task);
        return acc;
      },
      {
        draft: [] as typeof tasks,
        active: [] as typeof tasks,
        completed: [] as typeof tasks,
        archived: [] as typeof tasks,
      },
    );
  }, [tasks]);

  if (!tasks) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Tasks</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Tasks</h3>
        <div className="text-sm text-muted-foreground">
          {tasks?.length || 0} total tasks
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLabelType} onValueChange={setFilterLabelType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image classification">
              Image Classification
            </SelectItem>
            <SelectItem value="object detection">Object Detection</SelectItem>
            <SelectItem value="text labeling">Text Labeling</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({tasksByStatus.draft.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({tasksByStatus.active.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({tasksByStatus.completed.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({tasksByStatus.archived.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TaskGrid
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onSelect={onTaskSelect}
          />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <TaskGrid
            tasks={tasksByStatus.draft}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onSelect={onTaskSelect}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <TaskGrid
            tasks={tasksByStatus.active}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onSelect={onTaskSelect}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <TaskGrid
            tasks={tasksByStatus.completed}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onSelect={onTaskSelect}
          />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <TaskGrid
            tasks={tasksByStatus.archived}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onSelect={onTaskSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Task {
  _id: string;
  title: string;
  description: string;
  labelType: string;
  status: string;
  createdAt: number;
  imageCount: number;
}

interface TaskGridProps {
  tasks: Task[];
  onStatusChange: (
    taskId: string,
    status: "draft" | "active" | "completed" | "archived",
  ) => void;
  onDelete: (taskId: string, title: string) => void;
  onSelect?: (taskId: string) => void;
}

function TaskGrid({
  tasks,
  onStatusChange,
  onDelete,
  onSelect,
}: TaskGridProps) {
  const getLabelTypeIcon = (type: string) => {
    switch (type) {
      case "image classification":
        return <ImageIcon className="h-4 w-4" />;
      case "object detection":
        return <ImageIcon className="h-4 w-4" />;
      case "text labeling":
        return <FileText className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "active":
        return "default";
      case "completed":
        return "outline";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="h-3 w-3" />;
      case "active":
        return <Play className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "archived":
        return <Archive className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          No tasks found
        </h4>
        <p className="text-gray-500">
          Create your first task to get started with labeling.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <Card key={task._id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{task.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={getStatusBadgeVariant(task.status)}
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(task.status)}
                    {task.status}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getLabelTypeIcon(task.labelType)}
                    {task.labelType}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelect?.(task._id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {task.status === "draft" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(task._id, "active")}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Task
                    </DropdownMenuItem>
                  )}
                  {task.status === "active" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(task._id, "completed")}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(task._id, "draft")}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Task
                      </DropdownMenuItem>
                    </>
                  )}
                  {task.status === "completed" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(task._id, "archived")}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(task._id, task.title)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {task.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {task.imageCount || 0} images
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
