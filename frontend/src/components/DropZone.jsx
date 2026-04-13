import React from 'react';
import { useDropzone } from 'react-dropzone';

export default function DropZone({ onFileDrop }) {
 const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: { 'application/pdf': ['.pdf'] },
  maxFiles: 1,
  onDrop: (acceptedFiles) => {
   if (acceptedFiles.length > 0) {
    onFileDrop(acceptedFiles[0]);
   }
  }
 });

 return (
  <div {...getRootProps({ className: `dropzone${isDragActive ? ' active' : ''}` })}>
   <input {...getInputProps()} />
   <div className="dropzone-icon">📄</div>
   {isDragActive ? (
    <>
     <h2>Upuść plik PDF tutaj</h2>
     <p>Zwolnij, aby rozpocząć przetwarzanie</p>
    </>
   ) : (
    <>
     <h2>Przeciągnij fakturę PDF</h2>
     <p>lub kliknij, aby wybrać plik z dysku</p>
     <span className="hint">Wybierz plik PDF</span>
    </>
   )}
  </div>
 );
}
