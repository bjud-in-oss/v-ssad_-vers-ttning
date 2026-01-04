
import React, { useMemo } from 'react';
import { calculateDiffLines } from '../../utils/diffUtils';

interface LiveVisualDiffProps {
    original: string;
    current: string;
    startText?: string;
}

const LiveVisualDiff: React.FC<LiveVisualDiffProps> = ({ original, current, startText }) => {
    const diffLines = useMemo(() => calculateDiffLines(original, current), [original, current]);
    const hasChanges = diffLines.some(l => l.type !== ' ');

    if (!hasChanges) {
        return (
            <div className="p-10 flex flex-col items-center justify-center text-slate-500 h-full select-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No changes in this view.</p>
            </div>
        );
    }

    return (
        <div className="p-6 font-mono text-sm whitespace-pre-wrap relative">
            {/* Legend */}
            <div className="absolute top-0 right-4 p-2 flex gap-3 text-[10px] uppercase font-bold tracking-wider bg-slate-950/80 rounded-b-lg border-x border-b border-slate-700 z-10 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]"></span> 
                    <span className="text-blue-400">AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]"></span> 
                    <span className="text-green-400">YOU</span>
                </div>
            </div>

            {diffLines.map((line, idx) => {
                let bgClass = '';
                let textClass = 'text-slate-400';
                
                if (line.type === '+') {
                    // Logic to determine WHO added the line (AI or User)
                    // If line exists in startText, AI put it there. If not, User typed it.
                    const isAiChange = startText && startText.includes(line.text);

                    if (isAiChange) {
                        bgClass = 'bg-blue-900/20';
                        textClass = 'text-blue-400';
                    } else {
                        // User changes -> Green (was Orange)
                        bgClass = 'bg-green-900/20';
                        textClass = 'text-green-400';
                    }
                } else if (line.type === '-') {
                    // Reduced opacity to make it less confusing
                    bgClass = 'bg-red-900/10';
                    textClass = 'text-red-500/40 line-through decoration-red-500/30';
                }

                return (
                    <div key={idx} className={`${bgClass} px-2 -mx-2`}>
                        <span className={`inline-block w-4 mr-2 opacity-30 select-none ${textClass}`}>{line.type}</span>
                        <span className={textClass}>{line.text}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default LiveVisualDiff;
