import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    labelType: v.union(
      v.literal("image classification"),
      v.literal("object detection"),
      v.literal("text labeling"),
    ),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      labelType: args.labelType,
      organizationId: args.organizationId,
      createdAt: now,
      updatedAt: now,
      status: "draft",
    });

    return taskId;
  },
});

// Add images to a task
export const addTaskImages = mutation({
  args: {
    taskId: v.id("tasks"),
    images: v.array(
      v.object({
        imageUrl: v.string(),
        fileName: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        storageId: v.id("_storage"),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const imageIds = [];

    for (const image of args.images) {
      const imageId = await ctx.db.insert("task_images", {
        taskId: args.taskId,
        imageUrl: image.imageUrl,
        fileName: image.fileName,
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        storageId: image.storageId,
        uploadedAt: now,
      });
      imageIds.push(imageId);
    }

    return imageIds;
  },
});

// Get all tasks for an organization
export const getTasksByOrganization = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    // Get image counts for each task
    const tasksWithImageCounts = await Promise.all(
      tasks.map(async (task) => {
        const imageCount = await ctx.db
          .query("task_images")
          .withIndex("by_task", (q) => q.eq("taskId", task._id))
          .collect()
          .then((images) => images.length);

        return {
          ...task,
          imageCount,
        };
      })
    );

    return tasksWithImageCounts;
  },
});

// Get a single task by ID
export const getTaskById = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      return null;
    }

    const images = await ctx.db
      .query("task_images")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    return {
      ...task,
      images,
    };
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: now,
    });

    return args.taskId;
  },
});

// Delete a task and its associated images
export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    // First delete all associated images
    const images = await ctx.db
      .query("task_images")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const image of images) {
      await ctx.db.delete(image._id);
      // Also delete from storage
      await ctx.storage.delete(image.storageId);
    }

    // Then delete the task
    await ctx.db.delete(args.taskId);

    return args.taskId;
  },
});

// Generate upload URL for images
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get storage URL for an image
export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
