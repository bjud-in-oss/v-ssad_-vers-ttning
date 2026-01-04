
import React from 'react';

interface SaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiStudioLink: string;
    isChatOnly: boolean;
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, aiStudioLink, isChatOnly }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="absolute inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30 text-center">
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Redigeringar Sparade!</h2>
                    <p className="text-cyan-200 mt-2">En backup-fil har laddats ner till din dator.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 font-bold shrink-0">1</div>
                            <div>
                                <h3 className="text-white font-bold">Kopiera Prompt</h3>
                                <p className="text-sm text-slate-400">Instruktionerna för AI:n har kopierats till urklipp.</p>
                                {isChatOnly && <span className="text-xs text-amber-400 mt-1 block">Mode: Endast diskussion (Ingen kod ändras)</span>}
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 font-bold shrink-0">2</div>
                            <div>
                                <h3 className="text-white font-bold">Gå till AI Studio</h3>
                                <p className="text-sm text-slate-400">Klistra in prompten i chatten för att applicera ändringarna.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <a 
                            href={aiStudioLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            Öppna AI Studio & Klistra in
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                        >
                            Stäng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveModal;
