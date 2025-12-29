import React, { useCallback, useState, useRef } from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  currentImage: string | null;
  onClear: () => void;
  title?: string;
  subtitle?: string;
  height?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  currentImage, 
  onClear,
  title = "Upload Selfie",
  subtitle = "Drag and drop or click to browse",
  height = "h-96"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip the data:image/xyz;base64, prefix for processing later, but keep it for preview
        onImageSelected(result, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (currentImage) {
    return (
      <div className={`relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shadow-2xl ${height}`}>
        <img 
          src={currentImage} 
          alt="Original Upload" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={onClear}
            className="px-4 py-2 bg-red-500/90 text-white rounded-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg"
          >
            Remove & Upload New
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
          Uploaded
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative ${height} rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-indigo-400/50 hover:bg-slate-800'
        }
      `}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleChange} 
        className="hidden" 
      />
      
      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </div>

      <div className="text-center px-4">
        <p className="text-lg font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="absolute bottom-4 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700">
        Supports JPG, PNG
      </div>
    </div>
  );
};