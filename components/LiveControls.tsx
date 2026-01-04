
import React from 'react';
import { UIText } from '../types';
import { ConnectionState } from '../hooks/useConnectionManager';

interface LiveControlsProps {
    isLive: boolean;
    connectionState: ConnectionState;
    onToggle: () => void;
    scale: number;
    uiText: UIText['dashboard'];
}

const LiveControls: React.FC<LiveControlsProps> = ({ isLive, connectionState, onToggle, scale, uiText }) => {
    const isConnecting = connectionState === 'CONNECTING';

    return (
        <footer className="fixed bottom-0 w-full p-6 pb-8 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent z-50 flex flex-col items-center justify-end pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-2">
                <button
                    onClick={onToggle}
                    disabled={false} // Always clickable to allow abort
                    title={isConnecting ? "Connecting... (Tap to Cancel)" : (isLive ? "Stop (Manual Mute)" : "Start (Unmute)")}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center outline-none will-change-transform transition-all duration-300 border-4 shadow-2xl ${
                        isConnecting
                        ? 'bg-slate-900 border-amber-500/80 shadow-amber-500/20'
                        : isLive 
                        ? 'bg-slate-900 border-cyan-500/50 shadow-cyan-500/20' 
                        : 'bg-slate-800 border-slate-600 hover:border-slate-400 shadow-black/50 hover:scale-105'
                    }`}
                    style={{
                        transform: isLive ? `scale(${scale})` : 'scale(1)',
                    }}
                >
                    <div className="relative z-20">
                        {isConnecting ? (
                            <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 transition-colors duration-300 ${isLive ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                </svg>
                                
                                {!isLive && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <svg className="h-12 w-12 text-red-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {isConnecting && (
                        <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping-slow"></div>
                    )}

                    {isLive && !isConnecting && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping-slow"></div>
                            <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping delay-150"></div>
                        </>
                    )}
                </button>

                <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${isConnecting ? 'text-amber-400' : 'text-slate-400'}`}>
                    {isConnecting ? 'CONNECTING...' : (isLive ? 'LIVE' : uiText.statusPaused)}
                </span>
            </div>
        </footer>
    );
};

export default LiveControls;
