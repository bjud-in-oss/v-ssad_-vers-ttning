
import React from 'react';
import { TranslationMode, TranslationTempo, UIText, AcousticEnvironment, Language } from '../types';
import MicrophoneSelector from './MicrophoneSelector';
import SpeakerSelector from './SpeakerSelector';

interface DetailSettingsProps {
    isExpanded: boolean;
    onToggle: () => void;
    uiText: UIText['dashboard'];
    selectedTempo: TranslationTempo;
    onTempoSelect: (tempo: TranslationTempo) => void;
    selectedMicId: string;
    onMicSelect: (id: string) => void;
    selectedTriggerMicId: string;
    onTriggerMicSelect: (id: string) => void;
    selectedSpeakerId: string;
    onSpeakerSelect: (id: string) => void;
    selectedMode: TranslationMode;
    isLive: boolean;
    showMetrics: boolean;
    onToggleMetrics: (show: boolean) => void;
    onOpenHostAdmin: () => void;
    
    // Acoustic Env
    selectedEnvironment: AcousticEnvironment;
    onEnvironmentSelect: (env: AcousticEnvironment) => void;

    // UI Language (New)
    uiLanguage: Language;
    onUiLanguageChange: (lang: Language) => void;
}

const DetailSettings: React.FC<DetailSettingsProps> = ({
    isExpanded, onToggle, uiText, 
    selectedTempo, onTempoSelect,
    selectedMicId, onMicSelect,
    selectedTriggerMicId, onTriggerMicSelect,
    selectedSpeakerId, onSpeakerSelect,
    selectedMode, isLive,
    showMetrics, onToggleMetrics, onOpenHostAdmin,
    selectedEnvironment, onEnvironmentSelect,
    uiLanguage, onUiLanguageChange
}) => {
    return (
        <div className="w-full z-10 mb-4 animate-fade-in">
            <label className="text-[13px] text-slate-500 font-bold uppercase tracking-wider block text-center mb-2">{uiText.detailsLabel}</label>
            <button 
                onClick={onToggle}
                className="w-full flex items-center justify-center relative bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors group"
            >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-white">
                    {isExpanded ? uiText.toggleDetailsLess : uiText.toggleDetailsMore}
                </span>
                <div className="absolute right-4">
                    <svg 
                        className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-slate-800/30 border-x border-b border-slate-700 rounded-b-xl p-6 shadow-inner backdrop-blur-sm space-y-6 mt-1">
                    
                    <div className={`space-y-6 transition-opacity duration-300 ${isLive ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        
                        {/* 1. ACOUSTIC PROFILE (NEW) */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate-500 uppercase">{uiText.envLabel}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onEnvironmentSelect('small-group')}
                                    className={`py-3 px-2 rounded-lg text-xs font-bold transition-all border ${
                                        selectedEnvironment === 'small-group' 
                                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                                >
                                    {uiText.envSmall}
                                </button>
                                <button
                                    onClick={() => onEnvironmentSelect('large-group')}
                                    className={`py-3 px-2 rounded-lg text-xs font-bold transition-all border ${
                                        selectedEnvironment === 'large-group' 
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                                >
                                    {uiText.envLarge}
                                </button>
                            </div>
                        </div>

                        {/* 2. TEMPO */}
                        <div className="space-y-2">
                            <label className="text-[13px] font-bold text-slate-500 uppercase">{uiText.tempoLabel}</label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                                {(['standard', 'fast', 'presentation'] as TranslationTempo[]).map(tempo => (
                                    <button
                                        key={tempo}
                                        onClick={() => onTempoSelect(tempo)}
                                        className={`py-2 rounded-md text-[10px] font-bold transition-all capitalize ${selectedTempo === tempo ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        {tempo}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. HARDWARE */}
                        <div className="space-y-3 pt-2 border-t border-slate-700/50">
                            <MicrophoneSelector 
                                selectedDeviceId={selectedMicId} 
                                onSelect={onMicSelect} 
                                disabled={false} 
                                label={uiText.micLabel} 
                            />
                            {(selectedMode === TranslationMode.SIMULTANEOUS || selectedTempo === 'fast') && (
                                <MicrophoneSelector 
                                    selectedDeviceId={selectedTriggerMicId} 
                                    onSelect={onTriggerMicSelect} 
                                    disabled={false} 
                                    optional={true} 
                                    label={uiText.triggerLabel} 
                                />
                            )}
                            <SpeakerSelector 
                                selectedDeviceId={selectedSpeakerId} 
                                onSelect={onSpeakerSelect} 
                                disabled={false} 
                                label={uiText.speakerLabel} 
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/50 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={showMetrics} 
                                onChange={(e) => onToggleMetrics(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus:ring-cyan-500" 
                            />
                            <span className="text-xs text-slate-400 font-bold">{uiText.showMetrics}</span>
                        </label>

                        {/* UI LANGUAGE TOGGLE */}
                        <div className="flex items-center justify-between pt-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase">UI Language</span>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => onUiLanguageChange(Language.SWEDISH)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded border ${
                                        uiLanguage === Language.SWEDISH 
                                        ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400'
                                    }`}
                                >
                                    SV
                                </button>
                                <button 
                                    onClick={() => onUiLanguageChange(Language.ENGLISH)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded border ${
                                        uiLanguage === Language.ENGLISH
                                        ? 'bg-cyan-900/50 border-cyan-500 text-cyan-400' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400'
                                    }`}
                                >
                                    EN
                                </button>
                             </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button 
                                onClick={onOpenHostAdmin}
                                className="text-[10px] text-slate-600 hover:text-cyan-500 transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
                            >
                                <span className="opacity-50">🛡️</span> {uiText.hostButton}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailSettings;