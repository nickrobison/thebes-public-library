"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FolderOpen } from "lucide-react";

interface ImportDialogProps {
  onClose: () => void;
}

interface UploadResult {
  importId: string;
  status: string;
  originalFilename: string;
}

export function ImportDialog({ onClose }: ImportDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("web-upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleWebUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = (await response.json()) as UploadResult;
      setUploadResult(result);
      setSelectedFile(null);
      toast.success(`Queued ${result.originalFilename} for import`);
      await queryClient.invalidateQueries({ queryKey: ["library"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="web-upload">Web Upload</TabsTrigger>
          <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="web-upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Single File Upload
              </CardTitle>
              <CardDescription>
                Upload a single PDF file from your computer. The file will be processed and added to the library.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select PDF file</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <Button
                onClick={handleWebUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload and Process"}
              </Button>

              {uploadResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-800">Upload Successful</div>
                  <div className="text-xs text-green-600 mt-1">
                    Import job: {uploadResult.importId} ({uploadResult.status})
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Bulk Directory Import
              </CardTitle>
              <CardDescription>
                Import multiple documents from a directory. This will process all PDF files in the selected directory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="directory-input">Directory path</Label>
                <div className="flex gap-2">
                  <Input
                    id="directory-input"
                    placeholder="/path/to/documents"
                    disabled={true}
                  />
                  <Button variant="outline" disabled>
                    Browse
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Note: Bulk import directory functionality is planned for Phase 4.
                </div>
              </div>

              <Button disabled className="w-full">
                Start Bulk Import
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}