
import React, { useState, useCallback } from 'react';
import { generateHuggingImage } from './services/geminiService';
import type { ImageData } from './types';

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-gray-400 group-hover:text-blue-500 transition-colors">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4 p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
    <p className="text-lg text-gray-700">Creating your special moment...</p>
    <p className="text-sm text-gray-500">This can take a moment, please be patient.</p>
  </div>
);

interface ImageUploaderProps {
  id: string;
  label: string;
  onFileChange: (file: File) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onFileChange, previewUrl }) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileChange(event.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="cursor-pointer group">
        <div className="relative border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-all duration-300 ease-in-out aspect-square flex flex-col items-center justify-center p-4 bg-white shadow-sm hover:shadow-md">
          {previewUrl ? (
            <img src={previewUrl} alt={`${label} preview`} className="absolute inset-0 w-full h-full object-cover rounded-xl" />
          ) : (
            <>
              <UploadIcon />
              <p className="mt-2 text-sm font-semibold text-gray-600">{label}</p>
              <p className="text-xs text-gray-500">Click to upload</p>
            </>
          )}
        </div>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [childPhoto, setChildPhoto] = useState<File | null>(null);
  const [adultPhoto, setAdultPhoto] = useState<File | null>(null);
  const [childPhotoPreview, setChildPhotoPreview] = useState<string | null>(null);
  const [adultPhotoPreview, setAdultPhotoPreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>) => (file: File) => {
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const fileToBase64 = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const [header, data] = result.split(',');
        if (!header || !data) {
          reject(new Error("Invalid file format"));
          return;
        }
        const mimeTypeMatch = header.match(/:(.*?);/);
        if (!mimeTypeMatch || !mimeTypeMatch[1]) {
          reject(new Error("Could not determine MIME type"));
          return;
        }
        const mimeType = mimeTypeMatch[1];
        resolve({ mimeType, data });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateClick = useCallback(async () => {
    if (!childPhoto || !adultPhoto) {
      setError("Please upload both photos before generating.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const childPhotoData = await fileToBase64(childPhoto);
      const adultPhotoData = await fileToBase64(adultPhoto);

      const imageUrl = await generateHuggingImage(childPhotoData, adultPhotoData);
      setGeneratedImage(imageUrl);
    } catch (e) {
      console.error(e);
      setError("Failed to generate the image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [childPhoto, adultPhoto]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Hugging</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">Reconnect with your younger self. Upload two photos to create a unique, heartwarming image.</p>
        </header>

        <main>
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
              <ImageUploader id="child-photo" label="Your Photo as a Child" onFileChange={handleFileChange(setChildPhoto, setChildPhotoPreview)} previewUrl={childPhotoPreview} />
              <ImageUploader id="adult-photo" label="Your Recent Photo" onFileChange={handleFileChange(setAdultPhoto, setAdultPhotoPreview)} previewUrl={adultPhotoPreview} />
            </div>

            <div className="text-center">
              <button
                onClick={handleGenerateClick}
                disabled={!childPhoto || !adultPhoto || isLoading}
                className="w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-10 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-md disabled:shadow-none"
              >
                {isLoading ? 'Generating...' : 'Create My Image'}
              </button>
            </div>
          </div>
          
          <div className="mt-8 md:mt-12">
            <div className="bg-white rounded-2xl shadow-lg min-h-[30rem] flex items-center justify-center p-6 md:p-10">
              {isLoading && <LoadingSpinner />}
              {error && <p className="text-red-500 text-center font-medium">{error}</p>}
              {!isLoading && !error && generatedImage && (
                <div className="w-full max-w-2xl">
                    <h2 className="text-2xl font-bold text-center mb-4">Your Generated Image</h2>
                    <img src={generatedImage} alt="Generated hug" className="rounded-xl shadow-2xl w-full" />
                </div>
              )}
              {!isLoading && !error && !generatedImage && (
                <div className="text-center text-gray-500">
                  <p className="text-xl font-medium">Your special moment will appear here.</p>
                  <p className="mt-2">Upload both photos and click 'Create My Image' to begin.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 py-4">
            <p className="text-sm text-gray-500">Powered by Gemini. Create your moment of connection.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
