import React, { useState } from 'react';
import { Upload, Save, Trash2, Check, Copy } from 'lucide-react';
import { AssetMap } from '../types';

interface AssetManagerProps {
    currentAssets: AssetMap;
    onSaveAssets: (newAssets: AssetMap) => void;
    onClose: () => void;
}

const MANAGED_ASSETS = [
    { key: 'workshop_bg_detailed', label: 'Workshop Background', codeKey: 'CUSTOM_WORKSHOP_BG' },
    { key: 'poster_rank', label: 'Ranking Poster', codeKey: 'CUSTOM_RANKING_POSTER' },
    { key: 'door_exit', label: 'Exit Door', codeKey: 'CUSTOM_EXIT_DOOR' },
    { key: 'shelf_scrolls', label: 'Stats Shelf', codeKey: 'CUSTOM_SHELF' },
    { key: 'portal_gate', label: 'Main Portal', codeKey: 'CUSTOM_PORTAL' },
    { key: 'book_lectern', label: 'Recipe Book', codeKey: 'CUSTOM_RECIPE_BOOK' },
    { key: 'crystal_large', label: 'Synthesis Crystal', codeKey: 'CUSTOM_CRYSTAL' },
];

export const AssetManager: React.FC<AssetManagerProps> = ({ currentAssets, onSaveAssets, onClose }) => {
    const [pendingAssets, setPendingAssets] = useState<AssetMap>({});
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    
    const handleFileChange = (key: string, file: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setPendingAssets(prev => ({ ...prev, [key]: base64 }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        const merged = { ...currentAssets, ...pendingAssets };
        try {
            onSaveAssets(merged);
            onClose();
        } catch (e) {
            alert("Failed to save assets locally.");
        }
    };

    const handleClearKey = (key: string) => {
        const newPending = { ...pendingAssets };
        delete newPending[key];
        setPendingAssets(newPending);
    };

    const copyCodeSnippet = (key: string, codeKey: string, base64: string) => {
        const snippet = `export const ${codeKey} = "${base64}";`;
        navigator.clipboard.writeText(snippet);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="absolute inset-0 bg-slate-900/95 z-[200] p-6 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">⚡</span> Asset Manager & Exporter
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white uppercase text-xs font-bold tracking-wider">Close</button>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded mb-4 text-xs text-blue-200">
                <strong>For Permanent Assets (Multiplayer):</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Upload an image below.</li>
                    <li>Click the <strong><Copy className="w-3 h-3 inline"/> Code</strong> button.</li>
                    <li>Paste the code into <code>src/customAssets.ts</code> in your editor.</li>
                    <li>Do <strong>NOT</strong> paste that file back to the AI chat!</li>
                </ol>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {MANAGED_ASSETS.map(asset => {
                    const currentSrc = pendingAssets[asset.key] || currentAssets[asset.key];
                    const isModified = !!pendingAssets[asset.key];

                    return (
                        <div key={asset.key} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-900 rounded border border-slate-600 flex-shrink-0 overflow-hidden relative">
                                <img src={currentSrc} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-200">{asset.label}</h4>
                                <p className="text-[10px] text-slate-500 font-mono truncate">{asset.key}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {isModified && (
                                    <button 
                                        onClick={() => copyCodeSnippet(asset.key, asset.codeKey || 'UNKNOWN', pendingAssets[asset.key])}
                                        className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-500/30"
                                        title="Copy code for customAssets.ts"
                                    >
                                        {copiedKey === asset.key ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3" />}
                                        Code
                                    </button>
                                )}

                                <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1">
                                    <Upload className="w-3 h-3" />
                                    Upload
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg" 
                                        className="hidden"
                                        onChange={(e) => e.target.files && handleFileChange(asset.key, e.target.files[0])} 
                                    />
                                </label>
                                {isModified && (
                                    <button 
                                        onClick={() => handleClearKey(asset.key)}
                                        className="bg-red-900/50 hover:bg-red-900 text-red-200 p-1.5 rounded transition-colors"
                                        title="Revert"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
                <button 
                    onClick={handleSave}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    <Save className="w-4 h-4" />
                    Save Changes Locally
                </button>
            </div>
        </div>
    );
};