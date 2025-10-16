"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTasks, CreateTaskData, TaskImage } from "@/hooks/use-tasks";
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from "lucide-react";

interface QuickCreateTaskProps {
  onTaskCreated?: () => void;
}

export function QuickCreateTask({ onTaskCreated }: QuickCreateTaskProps) {
  const router = useRouter();
  const { createTask, uploadImage } = useTasks();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    labelType: "" as
      | "image classification"
      | "object detection"
      | "text labeling"
      | "",
  });

  const [images, setImages] = useState<TaskImage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not a valid image file`);
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          toast.error(`${file.name} is too large. Maximum size is 10MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      const fileNames = validFiles.map((f) => f.name);
      setUploadingFiles((prev) => [...prev, ...fileNames]);

      try {
        const uploadPromises = validFiles.map(async (file) => {
          try {
            const taskImage = await uploadImage(file);
            return taskImage;
          } catch (error) {
            toast.error(`Failed to upload ${file.name}`);
            throw error;
          }
        });

        const uploadedImages = await Promise.all(uploadPromises);
        setImages((prev) => [...prev, ...uploadedImages]);
        toast.success(
          `Successfully uploaded ${uploadedImages.length} image(s)`,
        );
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploadingFiles((prev) =>
          prev.filter((name) => !fileNames.includes(name)),
        );
      }
    },
    [uploadImage],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [handleFileUpload],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    if (!formData.labelType) {
      toast.error("Please select a label type");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    try {
      const taskData: CreateTaskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        labelType: formData.labelType,
        images,
      };

      await createTask(taskData);

      toast.success("Task created successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        labelType: "",
      });
      setImages([]);

      if (onTaskCreated) {
        onTaskCreated();
      }

      // Navigate to dashboard
      router.push("/studio/organization/dashboard");
    } catch (error) {
      toast.error("Failed to create task. Please try again.");
      console.error("Error creating task:", error);
    }
  };

  const getLabelTypeIcon = (type: string) => {
    switch (type) {
      case "image classification":
        return <ImageIcon className="h-4 w-4" />;
      case "object detection":
        return <ImageIcon className="h-4 w-4" />;
      case "text labeling":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Quick Create Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what needs to be labeled..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                required
              />
            </div>

            {/* Label Type */}
            <div className="space-y-2">
              <Label htmlFor="labelType">Label Type *</Label>
              <Select
                value={formData.labelType}
                onValueChange={(value) => handleInputChange("labelType", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select label type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image classification">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image Classification
                    </div>
                  </SelectItem>
                  <SelectItem value="object detection">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Object Detection
                    </div>
                  </SelectItem>
                  <SelectItem value="text labeling">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Text Labeling
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Images *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">
                  Drag and drop images here, or click to select
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports: JPG, PNG, GIF (Max 10MB per file)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={uploadingFiles.length > 0}
                >
                  {uploadingFiles.length > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Select Images"
                  )}
                </Button>
              </div>

              {/* Uploading Files */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploading files...</p>
                  {uploadingFiles.map((fileName) => (
                    <div
                      key={fileName}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{fileName}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded Images */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Uploaded Images ({images.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                          <ImageIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {image.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(image.fileSize)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Label Type Badge */}
            {formData.labelType && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected Type:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getLabelTypeIcon(formData.labelType)}
                  {formData.labelType}
                </Badge>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={uploadingFiles.length > 0}
                className="flex-1"
              >
                Create Task
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ title: "", description: "", labelType: "" });
                  setImages([]);
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
