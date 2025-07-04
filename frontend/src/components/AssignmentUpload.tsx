import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AssignmentUploadProps {
  onUpload?: (file: File) => Promise<void>;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

export function AssignmentUpload({ 
  onUpload, 
  maxSize = 10, 
  allowedTypes = ['.pdf', '.doc', '.docx'],
  className = ''
}: AssignmentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setErrorMessage(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setErrorMessage(`File type must be one of: ${allowedTypes.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFile = async (file: File) => {
    setErrorMessage('');
    
    if (!validateFile(file)) {
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // Call the upload function if provided
      if (onUpload) {
        await onUpload(file);
      } else {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
    } catch (_error) {
      setUploadStatus('error');
      setErrorMessage('Upload failed. Please try again.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadStatus === 'uploading'}
        />

        <div className="text-center">
          {uploadStatus === 'idle' && (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">
                  Drop your assignment here, or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports {allowedTypes.join(', ')} up to {maxSize}MB
                </p>
              </div>
            </>
          )}

          {uploadStatus === 'uploading' && selectedFile && (
            <>
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{Math.round(uploadProgress)}% complete</p>
              </div>
            </>
          )}

          {uploadStatus === 'success' && selectedFile && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">Upload successful!</p>
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <File className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{selectedFile.name}</span>
                  <span className="text-sm text-gray-500">({formatFileSize(selectedFile.size)})</span>
                </div>
              </div>
            </>
          )}

          {uploadStatus === 'error' && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">Upload failed</p>
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              </div>
            </>
          )}
        </div>

        {(uploadStatus === 'success' || uploadStatus === 'error') && (
          <button
            onClick={resetUpload}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {selectedFile && uploadStatus !== 'idle' && (
        <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <File className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
            </div>
            <span className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</span>
          </div>
        </div>
      )}
    </div>
  );
}