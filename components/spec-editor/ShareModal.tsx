
import React, { useState } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    githubLink: string;
    onSaveLink: (key: 'githubLink', value: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, githubLink, onSaveLink }) => {
    const [editingLink, setEditingLink] = useState<'github' | null>(null);
    const [tempLinkValue, setTempLinkValue] = useState('');

    if (!isOpen) return null;

    return (
        <div 
            className="absolute inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* MODAL HEADER */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-bold text-white">Dela & Förbättra</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <p className="text-slate-400 text-sm">
                            Har du idéer eller hittat fel? Dela dem med oss.
                        </p>
                    </div>

                    {/* LINKS GRID */}
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex items-center justify-between gap-4">
                            {editingLink === 'github' ? (
                                <div className="flex-1 flex gap-2 animate-fade-in">
                                    <input 
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
                                        value={tempLinkValue}
                                        onChange={(e) => setTempLinkValue(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => { onSaveLink('githubLink', tempLinkValue); setEditingLink(null); }} className="bg-green-600 px-3 rounded text-white font-bold">✓</button>
                                    <button onClick={() => setEditingLink(null)} className="bg-slate-700 px-3 rounded text-white">✕</button>
                                </div>
                            ) : (
                                <>
                                    <a 
                                        href={githubLink}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex-1 py-3 bg-gray-100 hover:bg-white text-gray-900 font-bold text-lg rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-3"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                        Öppna GitHub Issues
                                    </a>
                                    <button 
                                        onClick={() => { setTempLinkValue(githubLink); setEditingLink('github'); }} 
                                        className="p-3 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-700 rounded-xl transition-colors"
                                        title="Redigera Länk"
                                    >
                                        ✎
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
