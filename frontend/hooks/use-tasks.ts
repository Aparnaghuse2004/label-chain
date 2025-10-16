import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

export interface TaskImage {
  imageUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageId: Id<"_storage">;
}

export interface CreateTaskData {
  title: string;
  description: string;
  labelType: "image classification" | "object detection" | "text labeling";
  images: TaskImage[];
}

export const useTasks = () => {
  const { user } = useUser();
  const organizationId = user?.id || "";

  // Queries
  const tasks = useQuery(
    api.tasks.getTasksByOrganization,
    organizationId ? { organizationId } : "skip",
  );

  // Mutations
  const createTaskMutation = useMutation(api.tasks.createTask);
  const addTaskImagesMutation = useMutation(api.tasks.addTaskImages);
  const updateTaskStatusMutation = useMutation(api.tasks.updateTaskStatus);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);
  const generateUploadUrlMutation = useMutation(api.tasks.generateUploadUrl);

  const createTask = async (taskData: CreateTaskData) => {
    try {
      // Create the task first
      const taskId = await createTaskMutation({
        title: taskData.title,
        description: taskData.description,
        labelType: taskData.labelType,
        organizationId,
      });

      // Add images if any
      if (taskData.images.length > 0) {
        await addTaskImagesMutation({
          taskId,
          images: taskData.images,
        });
      }

      return taskId;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const uploadImage = async (file: File): Promise<TaskImage> => {
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrlMutation();

      // Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await response.json();

      return {
        imageUrl: "", // Will be generated from storageId when needed
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageId,
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const updateTaskStatus = async (
    taskId: Id<"tasks">,
    status: "draft" | "active" | "completed" | "archived",
  ) => {
    try {
      return await updateTaskStatusMutation({ taskId, status });
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: Id<"tasks">) => {
    try {
      return await deleteTaskMutation({ taskId });
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  return {
    // Data
    tasks,

    // Actions
    createTask,
    uploadImage,
    updateTaskStatus,
    deleteTask,

    // Loading states
    isLoading: tasks === undefined,
  };
};

export const useTask = (taskId: Id<"tasks">) => {
  const task = useQuery(api.tasks.getTaskById, { taskId });

  return {
    task,
    isLoading: task === undefined,
  };
};
