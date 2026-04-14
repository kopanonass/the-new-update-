import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw, Sliders, Crop as CropIcon, Maximize, Undo2, Redo2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ImageEditorProps {
  image: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

interface EditorState {
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  filters: {
    brightness: number;
    contrast: number;
    grayscale: number;
    sepia: number;
    blur: number;
  };
}

export default function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'crop' | 'filters' | 'resize' | 'format'>('crop');
  const [saveFormat, setSaveFormat] = useState<'image/png' | 'image/jpeg' | 'image/bmp'>('image/png');
  
  // Filters
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  });

  // History management
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isApplyingHistory = useRef(false);

  // Initial state push
  useEffect(() => {
    const initialState: EditorState = {
      crop: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
      filters: {
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
      }
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  const pushToHistory = useCallback((newState: Partial<EditorState>) => {
    if (isApplyingHistory.current) return;

    setHistory(prev => {
      const currentBase = prev[historyIndex] || prev[prev.length - 1];
      const stateToPush: EditorState = {
        crop: newState.crop ?? currentBase.crop,
        zoom: newState.zoom ?? currentBase.zoom,
        rotation: newState.rotation ?? currentBase.rotation,
        filters: newState.filters ? { ...currentBase.filters, ...newState.filters } : currentBase.filters,
      };

      // Don't push if it's identical to current
      if (JSON.stringify(stateToPush) === JSON.stringify(currentBase)) return prev;

      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(stateToPush);
      
      // Limit history size
      if (newHistory.length > 50) newHistory.shift();
      
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      isApplyingHistory.current = true;
      const prevState = history[historyIndex - 1];
      setCrop(prevState.crop);
      setZoom(prevState.zoom);
      setRotation(prevState.rotation);
      setFilters(prevState.filters);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => { isApplyingHistory.current = false; }, 10);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isApplyingHistory.current = true;
      const nextState = history[historyIndex + 1];
      setCrop(nextState.crop);
      setZoom(nextState.zoom);
      setRotation(nextState.rotation);
      setFilters(nextState.filters);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => { isApplyingHistory.current = false; }, 10);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    // Push to history when interaction ends
    pushToHistory({ crop, zoom, rotation });
  }, [crop, zoom, rotation, pushToHistory]);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply rotation and filters to canvas
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return canvas.toDataURL(saveFormat);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSave = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onSave(croppedImage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 transition-colors">
            <X size={24} />
          </button>
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo"
            >
              <Undo2 size={20} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Redo"
            >
              <Redo2 size={20} />
            </button>
          </div>
        </div>
        <span className="font-bold text-lg hidden sm:inline">Edit Image</span>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold transition-all active:scale-95"
        >
          <Check size={20} />
          Save
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 relative bg-zinc-950">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: {
              filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`,
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-zinc-900 border-t border-white/10 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Tabs */}
          <div className="flex justify-center gap-4">
            {[
              { id: 'crop', icon: <CropIcon size={18} />, label: 'Crop & Rotate' },
              { id: 'filters', icon: <Sliders size={18} />, label: 'Filters' },
              { id: 'resize', icon: <Maximize size={18} />, label: 'Zoom' },
              { id: 'format', icon: <Download size={18} />, label: 'Format' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                  activeTab === tab.id ? "bg-yellow-400 text-black font-bold" : "text-zinc-400 hover:bg-white/5"
                )}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="h-24 flex items-center justify-center">
            {activeTab === 'crop' && (
              <div className="flex items-center gap-6 w-full">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider">
                    <span>Rotation</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    onMouseUp={() => pushToHistory({ rotation })}
                    onTouchEnd={() => pushToHistory({ rotation })}
                    className="w-full accent-yellow-400"
                  />
                </div>
                <button
                  onClick={() => {
                    setRotation(0);
                    pushToHistory({ rotation: 0 });
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 transition-all"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            )}

            {activeTab === 'resize' && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-wider">
                  <span>Zoom</span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  onMouseUp={() => pushToHistory({ zoom })}
                  onTouchEnd={() => pushToHistory({ zoom })}
                  className="w-full accent-yellow-400"
                />
              </div>
            )}

            {activeTab === 'filters' && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide w-full">
                {[
                  { name: 'Brightness', key: 'brightness', min: 0, max: 200 },
                  { name: 'Contrast', key: 'contrast', min: 0, max: 200 },
                  { name: 'Grayscale', key: 'grayscale', min: 0, max: 100 },
                  { name: 'Sepia', key: 'sepia', min: 0, max: 100 },
                  { name: 'Blur', key: 'blur', min: 0, max: 10 },
                ].map((f) => (
                  <div key={f.key} className="min-w-[120px] space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">{f.name}</span>
                    <input
                      type="range"
                      min={f.min}
                      max={f.max}
                      value={(filters as any)[f.key]}
                      onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                      onMouseUp={() => pushToHistory({ filters: { ...filters, [f.key]: (filters as any)[f.key] } })}
                      onTouchEnd={() => pushToHistory({ filters: { ...filters, [f.key]: (filters as any)[f.key] } })}
                      className="w-full accent-yellow-400 h-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'format' && (
              <div className="flex gap-4">
                {[
                  { label: 'PNG', value: 'image/png' },
                  { label: 'JPG', value: 'image/jpeg' },
                  { label: 'BMP', value: 'image/bmp' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setSaveFormat(f.value as any)}
                    className={cn(
                      "px-6 py-3 rounded-xl font-bold transition-all border",
                      saveFormat === f.value 
                        ? "bg-yellow-400 text-black border-yellow-400" 
                        : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
