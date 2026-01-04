
import React, { useState, useEffect, useRef } from 'react';
import { Language, TranslationMode, TranslationTempo, UIText, AcousticEnvironment } from './types';
import Header from './components/Header';
import SimultaneousDashboard from './components/SimultaneousDashboard';
import SpecEditor from './components/SpecEditor';
import TranslationOverlay from './components/TranslationOverlay';
import HostAdminStep from './components/steps/HostAdminStep';
import IOSWarning from './components/IOSWarning';
import { useAudioSession } from './hooks/useAudioSession';
import { DEFAULT_UI_TEXT } from './constants/uiConstants';
import { uiTranslationService } from './services/uiTranslationService';
import { getLanguageFromBrowser } from './utils/languageUtils';
import { gatewayService, GatewayStatus } from './services/gatewayService';

// Modular Components
import DashboardControls from './components/DashboardControls';
import DetailSettings from './components/DetailSettings';
import LiveControls from './components/LiveControls';

const App: React.FC = () => {
  // --- State ---
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedMode, setSelectedMode] = useState<TranslationMode>(TranslationMode.SIMULTANEOUS);
  const [selectedTempo, setSelectedTempo] = useState<TranslationTempo>('standard');
  const [selectedEnvironment, setSelectedEnvironment] = useState<AcousticEnvironment>('large-group');
  
  const [selectedMicId, setSelectedMicId] = useState<string>('default');
  const [selectedTriggerMicId, setSelectedTriggerMicId] = useState<string>(''); 
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('default');
  
  // UI Logic
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [isHostAdminOpen, setIsHostAdminOpen] = useState(false);
  
  const [uiText, setUiText] = useState<UIText>(DEFAULT_UI_TEXT);
  const [isTranslatingUI, setIsTranslatingUI] = useState(false);
  
  // UI Language State (Persisted)
  const [uiLanguage, setUiLanguage] = useState<Language>(() => {
      // 1. Try LocalStorage
      const saved = localStorage.getItem('polyglot_ui_lang');
      if (saved) return saved as Language;
      
      // 2. Try Browser
      const browser = getLanguageFromBrowser();
      if (browser) return browser;
      
      // 3. Default to Swedish (Master)
      return Language.SWEDISH;
  });

  // Debug & Spec Editor State
  const [isSpecEditorOpen, setIsSpecEditorOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('DISCONNECTED');

  // Auto-close Timer Ref
  const detailsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
      connectionState,
      isAiSpeaking,
      togglePause,
      startSession,
      endSession,
      setLanguage,
      setEnvironment,
      audioOutputElRef,
      analyserRef,
      dashboardState,
      lastBurstSize,
      inspectorMessage,
      aiEfficiency,
      totalLag,
      lagTrend
  } = useAudioSession();

  // "Live" includes pending states to prevent double-clicks
  const isLive = connectionState === 'CONNECTED' || connectionState === 'RECONNECTING' || connectionState === 'CONNECTING';
  
  // Visualizer sensitivity logic
  const visualSensitivity = 3.5; 
  const scale = 1 + Math.min(dashboardState.rms * visualSensitivity, 0.3);

  // --- Effects ---

  useEffect(() => {
      const unsub = gatewayService.onStatusChange(setGatewayStatus);
      return unsub;
  }, []);

  // UI Translation Effect
  useEffect(() => {
     const updateUI = async () => {
         // Save preference
         localStorage.setItem('polyglot_ui_lang', uiLanguage);

         setIsTranslatingUI(true);
         try {
            // Translate from Base (Swedish) to Target (uiLanguage)
            // If target is Swedish, it returns immediately.
            const translated = await uiTranslationService.translateUI(uiLanguage, DEFAULT_UI_TEXT);
            setUiText(translated);
         } catch(e) {
             console.warn("UI Translation failed", e);
             setUiText(DEFAULT_UI_TEXT); // Fallback to Swedish
         } finally {
             setIsTranslatingUI(false);
         }
     };
     updateUI();
  }, [uiLanguage]);

  // --- Helpers ---

  const autoCloseDetails = () => {
      if (detailsCloseTimerRef.current) clearTimeout(detailsCloseTimerRef.current);
      detailsCloseTimerRef.current = setTimeout(() => {
          setIsDetailsExpanded(false);
      }, 1500);
  };

  const toggleDetails = () => {
      // If user toggles manually, clear any pending auto-close to avoid surprise closing
      if (detailsCloseTimerRef.current) clearTimeout(detailsCloseTimerRef.current);
      setIsDetailsExpanded(!isDetailsExpanded);
  };

  // --- Handlers ---

  const handleLanguageSelect = async (lang: Language) => {
      setSelectedLanguage(lang);
      if (isLive) {
          setLanguage(lang);
      }
  };

  const handleModeSelect = async (mode: TranslationMode) => {
      setSelectedMode(mode);
      // Hot Swap: If live, restart session immediately with new mode
      if (isLive) {
          await startSession(
              selectedLanguage,
              mode,
              selectedTempo,
              selectedMicId,
              selectedTriggerMicId,
              selectedSpeakerId,
              selectedEnvironment
          );
      }
  };

  const handleEnvironmentSelect = (env: AcousticEnvironment) => {
      setSelectedEnvironment(env);
      if (isLive) {
          setEnvironment(env); // Hot update digital gain
      }
      autoCloseDetails();
  };

  const handleToggleLive = async () => {
      if (isLive) {
          // MANUAL MUTE: Go to Full Stop/Disconnect (No Auto-Wake)
          await endSession(true); 
      } else {
          // Go Live (Unmute)
          await startSession(
              selectedLanguage, 
              selectedMode, 
              selectedTempo,
              selectedMicId,    
              selectedTriggerMicId, 
              selectedSpeakerId,
              selectedEnvironment
          );
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <IOSWarning />
      <audio ref={audioOutputElRef} className="hidden" />
      <TranslationOverlay isVisible={isTranslatingUI} message={uiText.loadingOverlay.translating} />

      {/* Host Admin Modal */}
      {isHostAdminOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
              <HostAdminStep 
                  uiText={uiText.hostStep} 
                  onBack={() => setIsHostAdminOpen(false)} 
              />
          </div>
      )}

      <Header 
          isConnected={isLive || connectionState === 'SLEEP'} 
          isAiSpeaking={isAiSpeaking}
          analyser={analyserRef.current}
          onOpenSpecs={() => setIsSpecEditorOpen(true)}
      />

      {/* MAIN CONTENT - Scrollable */}
      <main className="flex-1 flex flex-col p-4 pb-32 relative overflow-y-auto scrollbar-hide items-center w-full max-w-3xl mx-auto">
        
        {/* Background Glow */}
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${isLive ? 'bg-cyan-900/20' : 'bg-slate-800/10'}`}></div>

        <DashboardControls 
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
            selectedMode={selectedMode}
            onModeSelect={handleModeSelect}
            uiText={uiText.dashboard}
            gatewayStatus={gatewayStatus}
            uiLanguage={uiLanguage}
        />

        <DetailSettings 
            isExpanded={isDetailsExpanded}
            onToggle={toggleDetails}
            uiText={uiText.dashboard}
            
            selectedTempo={selectedTempo}
            onTempoSelect={(t) => { setSelectedTempo(t); autoCloseDetails(); }}
            
            selectedEnvironment={selectedEnvironment}
            onEnvironmentSelect={handleEnvironmentSelect}

            selectedMicId={selectedMicId}
            onMicSelect={(id) => { setSelectedMicId(id); autoCloseDetails(); }}
            selectedTriggerMicId={selectedTriggerMicId}
            onTriggerMicSelect={(id) => { setSelectedTriggerMicId(id); autoCloseDetails(); }}
            selectedSpeakerId={selectedSpeakerId}
            onSpeakerSelect={(id) => { setSelectedSpeakerId(id); autoCloseDetails(); }}
            selectedMode={selectedMode}
            isLive={isLive}
            showMetrics={showMetrics}
            onToggleMetrics={(show) => { setShowMetrics(show); autoCloseDetails(); }}
            onOpenHostAdmin={() => setIsHostAdminOpen(true)}
            
            // New Props for Manual UI Language Control
            uiLanguage={uiLanguage}
            onUiLanguageChange={setUiLanguage}
        />

        {/* 4. SYSTEM METRICS (Merged Debug View) */}
        {showMetrics && (
            <div className="w-full z-10 mb-6 animate-fade-in">
                <div className="w-full flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded-t-xl px-4 py-3">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{uiText.dashboard.metricsTitle}</span>
                </div>

                <div className="bg-slate-800/30 border-x border-b border-slate-700 rounded-b-xl p-4 shadow-inner backdrop-blur-sm space-y-4">
                    
                    {/* VISUALIZER */}
                    <SimultaneousDashboard 
                        rms={dashboardState.rms}
                        vadProb={dashboardState.vadProb}
                        isGated={dashboardState.isGated}
                        bufferSize={dashboardState.bufferSize}
                        outputQueueSize={dashboardState.outputQueueSize}
                        trafficLight={dashboardState.trafficLight}
                        isUploading={dashboardState.isUploading}
                        lastBurstSize={lastBurstSize}
                        inspectorMessage={inspectorMessage}
                        aiEfficiency={aiEfficiency}
                        totalLag={totalLag}
                        lagTrend={lagTrend}
                        onTogglePause={togglePause}
                        analyser={analyserRef.current} // Pass Analyser for Spectrum
                    />

                    {/* THE MATRIX (Merged, No Header) */}
                    <div className="w-full bg-black/80 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-64 shadow-inner">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-400">
                            <div className="flex justify-between"><span>Connection:</span> <span className="text-white">{connectionState}</span></div>
                            
                            <div className="flex justify-between"><span>Gateway:</span> <span className={gatewayStatus === 'CONNECTED' ? 'text-green-500' : (gatewayStatus === 'ERROR' ? 'text-red-500' : 'text-slate-500')}>{gatewayStatus}</span></div>

                            <div className="flex justify-between"><span>RMS (Vol):</span> <span className="text-white">{dashboardState.rms.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>VAD Prob:</span> <span className="text-white">{dashboardState.vadProb.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Input Buffer:</span> <span className="text-white">{dashboardState.bufferSize} chunks</span></div>
                            <div className="flex justify-between"><span>Output Queue:</span> <span className="text-white">{dashboardState.outputQueueSize.toFixed(2)}s</span></div>
                            <div className="flex justify-between"><span>Total Lag:</span> <span className={`font-bold ${totalLag > 5 ? 'text-red-500' : 'text-green-500'}`}>{totalLag.toFixed(2)}s</span></div>
                            <div className="flex justify-between"><span>Burst Size:</span> <span className="text-white">{lastBurstSize}</span></div>
                            <div className="flex justify-between"><span>AI Efficiency:</span> <span className="text-white">{aiEfficiency.toFixed(2)}%</span></div>
                            <div className="flex justify-between"><span>Status Msg:</span> <span className="text-cyan-300">{inspectorMessage}</span></div>
                            
                            {/* ONLY SHOW WARNING IF ERROR OR CONNECTING. Hide if just Disconnected (Default). */}
                            {(gatewayStatus === 'ERROR' || gatewayStatus === 'CONNECTING') && (
                                <div className="col-span-2 text-red-500 font-bold text-center border-t border-slate-700 pt-2 mt-1 animate-pulse">
                                    ⚠️ {uiText.dashboard.gatewayDisconnected}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      </main>

      <LiveControls 
          isLive={isLive}
          connectionState={connectionState}
          onToggle={handleToggleLive}
          scale={scale}
          uiText={uiText.dashboard}
      />

      {/* Spec Editor Modal */}
      <SpecEditor 
          isOpen={isSpecEditorOpen}
          onClose={() => setIsSpecEditorOpen(false)}
      />
    </div>
  );
};

export default App;