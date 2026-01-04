
import React from 'react';

interface QuickEditorProps {
    text: string;
    setText: (text: string) => void;
    onRefineAndCopy: () => void;
    onSwitchToAdvanced: () => void;
    onClose: () => void;
    isRefining: boolean;
    refineSuccess: boolean;
}

const QuickEditor: React.FC<QuickEditorProps> = ({ 
    text, setText, onRefineAndCopy, onSwitchToAdvanced, onClose, isRefining, refineSuccess 
}) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 bg-slate-950 relative">
            {/* Close button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-full max-w-2xl space-y-2">
                <h2 className="text-2xl font-bold text-white text-center">Vad vill du ändra?</h2>
                <p className="text-slate-400 text-center text-sm">Beskriv din idé eller bugg. AI:n hjälper dig att formulera det tekniskt.</p>
            </div>

            <div className="w-full max-w-2xl relative">
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none shadow-inner text-base leading-relaxed"
                    placeholder="T.ex. Jag vill att bakgrunden ska vara mörkare, eller fixa buggen med ljudet..."
                />
            </div>

            {/* Success Feedback */}
            {refineSuccess && (
                <div className="w-full max-w-2xl bg-green-900/30 border border-green-500/30 rounded-xl p-4 flex items-center gap-4 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <h3 className="text-green-400 font-bold">Kopierat & Klart!</h3>
                        <p className="text-slate-300 text-sm">AI Studio har öppnats. Klistra in prompten i chatten och tryck <strong>Pil Upp</strong>.</p>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <button 
                    onClick={onSwitchToAdvanced}
                    className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors"
                >
                    Advanced Editor
                </button>
                
                {/* Main Action Button */}
                <button 
                    onClick={onRefineAndCopy}
                    disabled={isRefining || !text.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                    {isRefining ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Tänker...
                        </>
                    ) : (
                        <>
                            ✨ Refine & Copy Prompt
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default QuickEditor;