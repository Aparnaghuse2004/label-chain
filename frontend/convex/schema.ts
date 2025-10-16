import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    dateOfBirth: v.string(),
    accountType: v.union(v.literal("individual"), v.literal("organization")),
    walletAddress: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    labelType: v.union(
      v.literal("image classification"),
      v.literal("object detection"),
      v.literal("text labeling"),
    ),
    organizationId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived"),
    ),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  task_images: defineTable({
    taskId: v.id("tasks"),
    imageUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    storageId: v.id("_storage"),
    uploadedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_uploaded_at", ["uploadedAt"]),
});
