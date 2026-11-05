import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
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
      setUploadProgress("Reserving tenant quota & object key...");
      const reservation = await api.reserveUpload(
        selectedFile.name,
        selectedFile.size,
        selectedFile.type || "application/octet-stream"
      );

      setUploadProgress("Uploading binary payload...");
      const arrayBuffer = await selectedFile.arrayBuffer();
      await api.uploadBinary(reservation.upload_url, arrayBuffer);

      setUploadProgress("Finalizing & enqueuing for background vectorization...");
      await api.completeUpload(reservation.document_id);

      setUploadProgress("Complete! Processing enqueued.");
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
          className="border-2 border-dashed border-white/[0.12] hover:border-white/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04] group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform shadow-md">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            Click to select document or drag & drop
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PDF, DOCX, TXT, Markdown (Max 20 MB · Up to 200 pages)
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-3 p-3.5 bg-white/[0.04] border border-white/15 rounded-xl">
            <File className="w-5 h-5 text-white/80 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-xs font-medium text-slate-200">
            <Sparkles className="w-4 h-4 text-white animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
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
            Upload & Enqueue
          </Button>
        </div>
      </div>
    </Modal>
  );
};
