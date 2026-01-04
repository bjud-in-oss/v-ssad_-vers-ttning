
import React, { useMemo } from 'react';
import { Language, TranslationMode, UIText } from '../types';
import { GatewayStatus } from '../services/gatewayService';
import { LANGUAGE_ISO_MAP } from '../utils/languageUtils';

interface DashboardControlsProps {
    selectedLanguage: Language;
    onLanguageSelect: (lang: Language) => void;
    selectedMode: TranslationMode;
    onModeSelect: (mode: TranslationMode) => void;
    uiText: UIText['dashboard'];
    gatewayStatus: GatewayStatus;
    uiLanguage: Language; // New Prop for localization
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
    selectedLanguage,
    onLanguageSelect,
    selectedMode,
    onModeSelect,
    uiText,
    gatewayStatus,
    uiLanguage
}) => {

    // Memoize language options to display them in the selected UI language
    const languageOptions = useMemo(() => {
        try {
            // Map the internal Language enum to an ISO code for the UI language
            const uiIso = LANGUAGE_ISO_MAP[uiLanguage] || 'en';
            const displayNames = new Intl.DisplayNames([uiIso], { type: 'language' });

            return Object.values(Language).map((langEnum) => {
                const targetIso = LANGUAGE_ISO_MAP[langEnum];
                let localizedName: string = langEnum;

                if (targetIso) {
                    try {
                        const translated = displayNames.of(targetIso);
                        if (translated) {
                            // Capitalize
                            localizedName = translated.charAt(0).toUpperCase() + translated.slice(1);
                        }
                    } catch (e) { /* ignore */ }
                }

                // If translation is same as key (e.g. English -> English), just use it.
                // Otherwise show "Translated (Original)" or just "Translated" depending on preference.
                // Here we prioritize the Translated name for full immersion.
                return { value: langEnum, label: localizedName };
            });
        } catch (error) {
            // Fallback
            return Object.values(Language).map(lang => ({ value: lang, label: lang }));
        }
    }, [uiLanguage]);

    return (
        <>
            {/* 1. TOP: YOUR LANGUAGE */}
            <div className="w-full mb-6 shrink-0 z-10">
                <label className="text-[13px] text-slate-500 font-bold uppercase tracking-wider block text-center mb-2">{uiText.yourLanguageLabel}</label>
                <div className="relative">
                    <select 
                        value={selectedLanguage}
                        onChange={(e) => onLanguageSelect(e.target.value as Language)}
                        style={{ textAlignLast: 'center' }} // iOS Safari fix for text centering
                        className="w-full bg-slate-800/80 border border-slate-600 text-white text-center font-bold text-lg rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors shadow-lg"
                    >
                        {languageOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* 2. TRANSLATION MODE */}
            <div className="w-full mb-6 shrink-0 z-10">
                <label className="text-[13px] text-slate-500 font-bold uppercase tracking-wider block text-center mb-2">{uiText.modeLabel}</label>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => onModeSelect(TranslationMode.SIMULTANEOUS)}
                        className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all shadow-lg text-lg flex items-center justify-center ${
                            selectedMode === TranslationMode.SIMULTANEOUS 
                            ? 'bg-slate-800/80 border-2 border-slate-600 text-white ring-2 ring-cyan-500/50' 
                            : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700'
                        }`}
                    >
                        {uiText.modeSimultaneous}
                    </button>
                    <button
                        onClick={() => onModeSelect(TranslationMode.SEQUENTIAL)}
                        className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all shadow-lg text-lg flex items-center justify-center ${
                            selectedMode === TranslationMode.SEQUENTIAL 
                            ? 'bg-slate-800/80 border-2 border-slate-600 text-white ring-2 ring-cyan-500/50' 
                            : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700'
                        }`}
                    >
                        {uiText.modeTakeTurns}
                    </button>
                </div>
            </div>

            {/* GATEWAY STATUS TEXT */}
            {gatewayStatus !== 'DISCONNECTED' && (
                <div className={`text-xs font-bold font-mono tracking-wider mb-4 animate-pulse ${gatewayStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`}>
                    {gatewayStatus === 'CONNECTED' ? uiText.gatewayConnected : uiText.gatewayDisconnected}
                </div>
            )}
        </>
    );
};

export default DashboardControls;
