import React, { useState } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { HEADSHOT_STYLES } from './constants';
import { GeneratedImage, HeadshotStyle } from './types';
import { generateEditedImage, generateRandomEditPrompt } from './services/geminiService';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalMimeType, setOriginalMimeType] = useState<string>('image/jpeg');
  
  // New state for reference image (Face Swap)
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceMimeType, setReferenceMimeType] = useState<string>('image/jpeg');

  const [selectedStyle, setSelectedStyle] = useState<HeadshotStyle>(HeadshotStyle.CORPORATE);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRandomizing, setIsRandomizing] = useState<boolean>(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = (base64: string, mimeType: string) => {
    setOriginalImage(base64);
    setOriginalMimeType(mimeType);
    setError(null);
  };

  const handleReferenceSelected = (base64: string, mimeType: string) => {
    setReferenceImage(base64);
    setReferenceMimeType(mimeType);
    setError(null);
  }

  const handleClearImage = () => {
    setOriginalImage(null);
    setGeneratedResults([]);
    setError(null);
  };

  const handleClearReference = () => {
    setReferenceImage(null);
  }

  const handleRandomPrompt = async () => {
    setIsRandomizing(true);
    setError(null);
    try {
      const prompt = await generateRandomEditPrompt();
      setCustomPrompt(prompt);
    } catch (err) {
      console.error("Failed to generate random prompt", err);
      // Fallback is handled in service, but just in case
      setCustomPrompt("Increase brightness and smooth skin.");
    } finally {
      setIsRandomizing(false);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) return;

    setIsGenerating(true);
    setError(null);

    // Extract raw base64 data (remove data:image/xxx;base64, prefix)
    const base64Data = originalImage.split(',')[1];
    let referenceBase64Data = undefined;
    
    // Determine the prompt to use
    let promptToUse = '';
    
    // Find the base style prompt if a preset is selected
    const styleOption = HEADSHOT_STYLES.find(s => s.id === selectedStyle);
    const basePrompt = styleOption ? styleOption.promptSuffix : '';
    const additionalPrompt = customPrompt.trim();
    
    if (selectedStyle === HeadshotStyle.FACE_SWAP) {
      if (!referenceImage) {
        setError("Please upload a reference image for the Face Swap.");
        setIsGenerating(false);
        return;
      }
      referenceBase64Data = referenceImage.split(',')[1];
      
      // Face swap specific prompt - Enhanced for strict style copying
      promptToUse = `[STRICT ADHERENCE REQUIRED]
Primary Goal: Face Swap.
Reference Image (Second Image): This defines the target composition. You MUST copy the exact background, lighting, clothing, pose, and environment from this image.
Face Source (First Image): This defines the facial identity.
Action: Replace the face in the Reference Image with the face from the Face Source.
Constraints:
- Keep the background 100% identical to the Reference Image.
- Keep the clothing and pose 100% identical to the Reference Image.
- Match the skin tone and lighting of the face to the Reference Image's environment.
- The resulting face must be recognizable as the person in the First Image.
${additionalPrompt ? `Additional Instructions: ${additionalPrompt}` : ''}`;

    } else if (selectedStyle === HeadshotStyle.CUSTOM) {
      if (!additionalPrompt) {
        setError("Please enter a custom instruction for the edit.");
        setIsGenerating(false);
        return;
      }
      promptToUse = additionalPrompt;
    } else {
      // For presets, we combine the base prompt with any custom instructions
      promptToUse = basePrompt;
      if (additionalPrompt) {
        promptToUse = `${basePrompt} ${additionalPrompt}`;
      }
    }

    try {
      const generatedBase64 = await generateEditedImage(
        base64Data, 
        promptToUse, 
        originalMimeType,
        referenceBase64Data,
        referenceMimeType
      );
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `data:image/jpeg;base64,${generatedBase64}`,
        prompt: selectedStyle === HeadshotStyle.CUSTOM ? customPrompt : (selectedStyle === HeadshotStyle.FACE_SWAP ? 'Face Swap' : (styleOption?.label || 'Unknown')) + (customPrompt ? ` + Custom` : ''),
        timestamp: Date.now()
      };

      setGeneratedResults(prev => [newImage, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Input Controls */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* 1. Upload Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-sm flex items-center justify-center border border-slate-700">1</span>
                  Upload Selfie
                </h2>
              </div>
              <ImageUploader 
                currentImage={originalImage}
                onImageSelected={handleImageSelected}
                onClear={handleClearImage}
                title="Upload Selfie"
                subtitle="Your face source"
              />
            </section>

            {/* 2. Style Selection */}
            {originalImage && (
              <section className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-sm flex items-center justify-center border border-slate-700">2</span>
                    Choose Style & Edit
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {HEADSHOT_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`
                        p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group
                        ${selectedStyle === style.id 
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'
                        }
                      `}
                    >
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <h3 className={`font-medium ${selectedStyle === style.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                        {style.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {style.description}
                      </p>
                    </button>
                  ))}
                  
                  {/* Face Swap Option */}
                  <button
                    onClick={() => setSelectedStyle(HeadshotStyle.FACE_SWAP)}
                    className={`
                      col-span-1 p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group
                      ${selectedStyle === HeadshotStyle.FACE_SWAP
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'
                      }
                    `}
                  >
                     <div className="text-2xl mb-2">🎭</div>
                     <div>
                        <h3 className={`font-medium ${selectedStyle === HeadshotStyle.FACE_SWAP ? 'text-indigo-400' : 'text-slate-200'}`}>
                          Face Swap
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Copy pose, body & bg
                        </p>
                     </div>
                  </button>

                  {/* Custom Edit Option */}
                  <button
                    onClick={() => setSelectedStyle(HeadshotStyle.CUSTOM)}
                    className={`
                      col-span-1 p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group
                      ${selectedStyle === HeadshotStyle.CUSTOM 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">✨</div>
                    <div>
                      <h3 className={`font-medium ${selectedStyle === HeadshotStyle.CUSTOM ? 'text-indigo-400' : 'text-slate-200'}`}>
                        Custom Only
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Freeform text prompt
                      </p>
                    </div>
                  </button>
                </div>

                {/* Reference Image Uploader for Face Swap */}
                {selectedStyle === HeadshotStyle.FACE_SWAP && (
                  <div className="mb-6 p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-xl animate-fade-in">
                    <h3 className="text-sm font-medium text-indigo-300 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                      </svg>
                      Upload Reference Image
                    </h3>
                    <ImageUploader 
                      currentImage={referenceImage}
                      onImageSelected={handleReferenceSelected}
                      onClear={handleClearReference}
                      title="Reference Image (Body & BG)"
                      subtitle="We'll use this exact pose & environment"
                      height="h-48"
                    />
                  </div>
                )}

                {/* Custom Prompt Input - Always Visible */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-400">
                      {selectedStyle === HeadshotStyle.CUSTOM 
                        ? 'Describe your edit (Required)' 
                        : 'Additional Instructions (Optional)'}
                    </label>
                    <button
                      onClick={handleRandomPrompt}
                      disabled={isRandomizing}
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1 border border-indigo-500/30"
                      title="Generate a random edit (Brightness, Crop, Smooth, etc.)"
                    >
                        {isRandomizing ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Ai Thinking...
                        </>
                        ) : (
                        <>
                          🎲 Surprise Me
                        </>
                        )}
                    </button>
                  </div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={selectedStyle === HeadshotStyle.CUSTOM 
                      ? "e.g., 'Increase brightness and contrast', 'Smooth skin', 'Make me look like a cyberpunk character'"
                      : selectedStyle === HeadshotStyle.FACE_SWAP
                        ? "e.g., 'Make sure skin tone matches', 'Keep the background exactly the same'"
                        : "e.g., 'Make me smile', 'Add a red tie', 'Fix the lighting', 'Crop closer'"
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-24"
                  />
                </div>

                {/* Generate Button */}
                <div className="mt-6">
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isGenerating}
                    className="w-full py-4 text-lg shadow-xl shadow-indigo-900/20"
                  >
                    {selectedStyle === HeadshotStyle.FACE_SWAP ? 'Swap Face & Generate' : 'Generate Result'}
                  </Button>
                  
                  {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-sm flex items-center justify-center border border-slate-700">3</span>
                Results
              </h2>
              {generatedResults.length > 0 && (
                <span className="text-xs text-slate-500">{generatedResults.length} images generated</span>
              )}
            </div>

            {generatedResults.length === 0 ? (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-slate-900/20">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-500">No photos generated yet</p>
                <p className="text-sm mt-2 max-w-xs mx-auto">Upload a selfie and choose a style to generate your professional headshots.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedResults.map((result) => (
                  <div key={result.id} className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl transition-all hover:border-indigo-500/50">
                    <img 
                      src={result.url} 
                      alt={`Generated ${result.prompt}`} 
                      className="w-full h-auto object-cover aspect-square"
                    />
                    
                    {/* Overlay Details */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white font-medium truncate">{result.prompt}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                      <a 
                        href={result.url} 
                        download={`proshot-${result.id}.jpg`}
                        className="mt-3 inline-flex items-center justify-center w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download HD
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;