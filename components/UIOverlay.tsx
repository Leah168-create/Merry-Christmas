import React from 'react';
import { useStore } from '../store';
import { AppState } from '../types';

const UIOverlay: React.FC = () => {
  const { mode, addPhoto, photos, gesture, isCameraReady, setMode, focusedPhotoId, setFocusedPhotoId } = useStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      addPhoto(url);
    }
  };

  const getGestureStatus = () => {
      if (gesture.isFist) return "FIST: Assembling Tree";
      if (gesture.isOpenPalm) return "OPEN PALM: Scattering";
      if (gesture.isPinching) return "PINCH: Grabbing";
      return "Waiting for gesture...";
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10">
        <div>
          <h1 className="text-4xl text-amber-400 font-cinzel font-bold tracking-widest drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
            LUMIÈRE NOËL
          </h1>
          <p className="text-amber-100/60 text-sm mt-1 font-serif italic">
            A Gesture-Controlled Christmas Experience
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex flex-col items-end">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isCameraReady ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
                <div className={`w-2 h-2 rounded-full ${isCameraReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-white font-sans uppercase tracking-wide">
                    {isCameraReady ? 'Camera Active' : 'Camera Inactive'}
                </span>
             </div>
             <div className="mt-2 text-right">
                 <p className="text-amber-300 text-xs font-mono uppercase tracking-widest">
                     Detected: <span className="text-white">{getGestureStatus()}</span>
                 </p>
             </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-10 left-10 pointer-events-auto">
        <label className="group flex items-center gap-3 cursor-pointer bg-black/40 hover:bg-amber-900/40 backdrop-blur-md border border-amber-500/30 px-6 py-4 rounded-xl transition-all duration-300 hover:border-amber-500/80 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-black font-bold text-xl group-hover:scale-110 transition-transform">
            +
          </div>
          <div className="text-left">
            <p className="text-amber-100 font-bold text-sm uppercase tracking-wide">Add Memory</p>
            <p className="text-amber-100/50 text-xs">Upload Photo</p>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </label>
        
        <div className="mt-4 flex gap-2">
            {photos.map(p => (
                <div key={p.id} className="w-10 h-10 rounded border border-amber-500/30 overflow-hidden bg-black/50">
                    <img src={p.url} className="w-full h-full object-cover opacity-70" alt="memory" />
                </div>
            ))}
        </div>
      </div>

      {/* Guide / Instructions */}
      <div className="absolute bottom-10 right-10 max-w-sm text-right">
        <div className="space-y-4">
             <InstructionItem 
                icon="✊" 
                title="Assemble" 
                desc="Clench fist to form the tree" 
                active={gesture.isFist || mode === AppState.ASSEMBLED} 
            />
             <InstructionItem 
                icon="🖐" 
                title="Scatter" 
                desc="Open palm to release magic" 
                active={gesture.isOpenPalm || (mode === AppState.SCATTERED && !gesture.isPinching)} 
            />
             <InstructionItem 
                icon="👌" 
                title="Focus" 
                desc="Pinch near a photo to view" 
                active={gesture.isPinching || mode === AppState.FOCUS} 
            />
        </div>
      </div>

      {/* Close Button when Focused */}
      {mode === AppState.FOCUS && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
              <button 
                onClick={() => {
                    setMode(AppState.SCATTERED);
                    setFocusedPhotoId(null);
                }}
                className="absolute top-32 px-8 py-2 bg-black/60 border border-amber-500/50 text-amber-400 rounded-full hover:bg-amber-900/80 transition-all font-cinzel"
              >
                  Close Photo
              </button>
          </div>
      )}
    </div>
  );
};

const InstructionItem = ({ icon, title, desc, active }: { icon: string, title: string, desc: string, active: boolean }) => (
    <div className={`transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-40 translate-x-4'}`}>
        <div className="flex items-center justify-end gap-3">
            <div>
                <p className={`text-sm font-bold uppercase tracking-widest ${active ? 'text-amber-400' : 'text-gray-400'}`}>{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-xl bg-black/50 backdrop-blur ${active ? 'border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-gray-700 text-gray-600'}`}>
                {icon}
            </div>
        </div>
    </div>
);

export default UIOverlay;
