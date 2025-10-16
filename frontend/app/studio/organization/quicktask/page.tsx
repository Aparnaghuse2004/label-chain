"use client";

import { QuickCreateTask } from "@/components/tasks/quick-create-task";

export default function QuickTaskPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quick Create</h2>
      </div>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Create a new labeling task quickly and easily. Fill in the details
          below and upload your images to get started.
        </p>
        <QuickCreateTask />
      </div>
    </div>
  );
}
