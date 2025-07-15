import React, { useState, useCallback, useRef } from 'react';
import { useBackgroundRemoval } from '../../hooks/useBackgroundRemoval';
import { BackgroundRemovalOptions } from '../../services/backgroundRemoval/types';
import styles from './BackgroundRemovalTool.module.css';

interface BackgroundRemovalToolProps {
  onComplete: (result: Blob, originalFile: File) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

export const BackgroundRemovalTool: React.FC<BackgroundRemovalToolProps> = ({
  onComplete,
  maxFileSize = 10 * 1024 * 1024,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<BackgroundRemovalOptions['quality']>('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    removeBackground,
    isProcessing,
    progress,
    error,
    result,
    reset,
  } = useBackgroundRemoval();
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      alert(`Please select a valid image file (${acceptedFormats.join(', ')})`);
      return;
    }
    
    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${maxFileSize / 1024 / 1024}MB`);
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setProcessedUrl(null);
    reset();
  }, [acceptedFormats, maxFileSize, reset]);
  
  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;
    
    const result = await removeBackground(selectedFile, { quality });
    
    if (result) {
      const url = URL.createObjectURL(result.blob);
      setProcessedUrl(url);
      onComplete(result.blob, selectedFile);
    }
  }, [selectedFile, quality, removeBackground, onComplete]);
  
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    setPreviewUrl(null);
    setProcessedUrl(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, processedUrl, reset]);
  
  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, []);
  
  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className={styles.fileInput}
          id="bg-removal-file-input"
        />
        <label htmlFor="bg-removal-file-input" className={styles.uploadButton}>
          {selectedFile ? 'Change Image' : 'Select Image'}
        </label>
      </div>
      
      {selectedFile && (
        <>
          <div className={styles.qualitySelector}>
            <label>Quality:</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as BackgroundRemovalOptions['quality'])}
              disabled={isProcessing}
            >
              <option value="low">Low (Fast)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Best)</option>
            </select>
          </div>
          
          <div className={styles.previewContainer}>
            {previewUrl && (
              <div className={styles.preview}>
                <h3>Original</h3>
                <img src={previewUrl} alt="Original" />
              </div>
            )}
            
            {processedUrl && (
              <div className={styles.preview}>
                <h3>Processed</h3>
                <div className={styles.processedImage}>
                  <img src={processedUrl} alt="Processed" />
                </div>
              </div>
            )}
          </div>
          
          {progress && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className={styles.progressText}>{progress.message}</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              Error: {error.message}
            </div>
          )}
          
          {result && (
            <div className={styles.resultInfo}>
              <p>✓ Background removed successfully!</p>
              <p className={styles.stats}>
                Size: {result.width}x{result.height} | 
                Time: {(result.processingTime / 1000).toFixed(2)}s
              </p>
            </div>
          )}
          
          <div className={styles.actions}>
            <button
              onClick={handleProcess}
              disabled={isProcessing || !!processedUrl}
              className={styles.processButton}
            >
              {isProcessing ? 'Processing...' : 'Remove Background'}
            </button>
            
            {processedUrl && (
              <button
                onClick={handleReset}
                className={styles.resetButton}
              >
                Process Another Image
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
