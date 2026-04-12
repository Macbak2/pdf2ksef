import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function DropZone({ onFileAccepted, loading }) {
 const onDrop = useCallback((acceptedFiles) => {
  if (acceptedFiles.length > 0) {
   onFileAccepted(acceptedFiles[0]);
  }
 }, [onFileAccepted]);

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: { 'application/pdf': ['.pdf'] },
  multiple: false,
  disabled: loading,
 });

 return (
  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'disabled' : ''}`}>
   <input {...getInputProps()} />
   {loading ? (
    <div className="loading-state">
     <div className="spinner" />
     <p>Przetwarzanie faktury...</p>
    </div>
   ) : isDragActive ? (
    <p>Upuść plik PDF tutaj...</p>
   ) : (
    <>
     <p>Przeciągnij fakturę PDF lub kliknij, aby wybrać</p>
     <span className="dropzone-hint">Obsługiwane: PDF z warstwą tekstową</span>
    </>
   )}
  </div>
 );
}
