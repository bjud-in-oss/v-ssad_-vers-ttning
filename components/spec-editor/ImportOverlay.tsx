
import React, { useRef } from 'react';

interface ImportOverlayProps {
    onImport: (file: File) => void;
    onStartFresh: () => void;
}

const ImportOverlay: React.FC<ImportOverlayProps> = ({ onImport, onStartFresh }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onImport(file);
    };

    return (
        <div 
            className="absolute inset-0 z-[110] bg-slate-900/95 flex flex-col items-center justify-center space-y-8 p-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-white">Restore Previous State?</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    To see the diff between the previous version and the AI's latest updates, load your saved restore point.
                </p>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-sm">
                <input type="file" ref={fileInputRef} className="hidden" accept=".md" onChange={handleFileChange} />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-3 transition-transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Import Restore Point
                </button>
                
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">Or</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <button 
                    onClick={onStartFresh}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-lg rounded-xl border border-slate-700 transition-colors"
                >
                    Start Fresh (No Diff)
                </button>
            </div>
        </div>
    );
};

export default ImportOverlay;
