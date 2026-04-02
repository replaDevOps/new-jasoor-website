/**
 * useFileUpload.ts
 *
 * Uploads a file to https://verify.jusoor-sa.co/upload using raw fetch + FormData.
 * Mirrors OLD frontend UploadSupportDocStep.jsx uploadFileToServer() exactly.
 */

import { useState, useCallback } from 'react';

const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'https://verify.jusoor-sa.co/upload';

export interface UploadedFile {
  fileName: string;
  fileType: string;
  filePath: string;
  size: number;
  title?: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    title?: string
  ): Promise<UploadedFile | null> => {
    setUploading(true);
    setError(null);

    try {
      let fileToUpload = file;
      if (!file.name.includes('.')) {
        const extension = file.type ? `.${file.type.split('/')[1]}` : '';
        fileToUpload = new File(
          [file],
          `${file.name || `upload-${Date.now()}`}${extension}`,
          { type: file.type }
        );
      }

      const formData = new FormData();
      formData.append('file', fileToUpload, fileToUpload.name);

      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();

      return {
        fileName: data.fileName,
        fileType: data.fileType,
        filePath: data.fileUrl,
        size: file.size,
        title,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', err);
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    getTitle?: (file: File, index: number) => string
  ): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const title = getTitle ? getTitle(files[i], i) : files[i].name;
      const result = await uploadFile(files[i], title);
      if (result) results.push(result);
    }
    return results;
  }, [uploadFile]);

  return { uploadFile, uploadMultiple, uploading, error };
}
