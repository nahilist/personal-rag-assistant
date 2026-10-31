import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentUploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg("File size exceeds 20MB maximum limit.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      setUploadProgress("Reserving storage quota...");
      const reservation = await api.reserveUpload(
        selectedFile.name,
        selectedFile.size,
        selectedFile.type || "application/octet-stream"
      );

      setUploadProgress("Uploading file payload...");
      const arrayBuffer = await selectedFile.arrayBuffer();
      await api.uploadBinary(reservation.upload_url, arrayBuffer);

      setUploadProgress("Finalizing & enqueuing for durable processing...");
      await api.completeUpload(reservation.document_id);

      setUploadProgress("Complete!");
      setTimeout(() => {
        setIsUploading(false);
        setSelectedFile(null);
        setUploadProgress(null);
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setIsUploading(false);
      setUploadProgress(null);
      setErrorMsg(err.message || "Failed to upload document.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Private Document">
      <div className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Click to browse or drag and drop
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supported formats: PDF, DOCX, TXT, Markdown (Max 20 MB, 200 pages)
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
            <File className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        {uploadProgress && (
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {uploadProgress}
          </p>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
          >
            Upload & Process
          </Button>
        </div>
      </div>
    </Modal>
  );
};
