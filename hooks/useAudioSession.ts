
import { useRef, useState, useCallback, useEffect } from 'react';
import { LiveServerMessage } from '@google/genai';
import { Language, TranslationMode, TranslationTempo, AcousticEnvironment } from '../types';
import { gatewayService, MutexState } from '../services/gatewayService';
import { createPcmBlob } from '../utils/audioUtils';
import { useAudioPlayer } from './useAudioPlayer';
import { useConnectionManager } from './useConnectionManager';
import { useAudioRecorder } from './useAudioRecorder';

export const useAudioSession = () => {
    // Local UI State
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false); 
    const [isInputMuted, setIsInputMuted] = useState(false); 
    const [mutexState, setMutexState] = useState<MutexState>('OPEN');
    const [mutexOwner, setMutexOwner] = useState<string>('');
    
    // Performance Metrics
    const [lastBurstSize, setLastBurstSize] = useState(0);
    const [inspectorMessage, setInspectorMessage] = useState("System Ready");
    
    const [totalLag, setTotalLag] = useState(0); 
    const [lagTrend, setLagTrend] = useState<'STABLE' | 'RISING' | 'FALLING'>('STABLE');
    const [aiEfficiency, setAiEfficiency] = useState(100);

    const [dashboardState, setDashboardState] = useState({
        rms: 0,
        vadProb: 0, 
        isGated: true,
        trafficLight: 'OPEN' as 'OPEN' | 'TALK' | 'PAUSE' | 'SLEEP' | 'LOCKED',
        bufferSize: 0,
        outputQueueSize: 0, 
        isUploading: false
    });

    // --- REFS ---
    const isAiSpeakingRef = useRef<boolean>(false);
    const waitingForResponseRef = useRef<boolean>(false);
    const ignoreAudioResponseRef = useRef<boolean>(false);
    
    // Timers
    const watchdogTimerRef = useRef<any>(null);
    const quickReleaseTimerRef = useRef<any>(null); 
    const silenceStreamIntervalRef = useRef<any>(null);
    const autoStandbyTimerRef = useRef<any>(null);
    
    const isUploadingRef = useRef<boolean>(false);
    const isMutexLockedRef = useRef<boolean>(false);
    const isManuallyStoppedRef = useRef<boolean>(false);

    const lagHistoryRef = useRef<{time: number, val: number}[]>([]);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    
    const pendingLanguageRef = useRef<Language | null>(null);

    // --- SUB-HOOKS ---
    
    const { 
        queueAudio, 
        stopAudio: stopPlayer, 
        setSinkId, 
        ensureContext: ensureOutputContext,
        getOutputLag,
        audioOutputElRef
    } = useAudioPlayer({ 
        onAiSpeakingChange: useCallback((speaking: boolean) => {
            setIsAiSpeaking(speaking);
            isAiSpeakingRef.current = speaking;
            if (speaking) {
                setInspectorMessage("Translating...");
                if (autoStandbyTimerRef.current) clearTimeout(autoStandbyTimerRef.current);
            } else {
                setInspectorMessage("AI Finished");
                waitingForResponseRef.current = false;
                resetAutoStandby();
            }
        }, []),
        onPlaybackEnded: useCallback(() => {
            if (pendingLanguageRef.current) {
                 executeLanguageSwitch(pendingLanguageRef.current);
            }
        }, [])
    });

    const handleGeminiMessage = useCallback(async (message: LiveServerMessage, mode: TranslationMode) => {
         if (message.serverContent?.interrupted) setInspectorMessage("Interrupted");

         const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
         if (audioData) {
             if (ignoreAudioResponseRef.current) return;
             if (quickReleaseTimerRef.current) clearTimeout(quickReleaseTimerRef.current);
             stopSilenceStream();
             waitingForResponseRef.current = false; 
             if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
             
             queueAudio(audioData, mode);
         }
         
         if (message.serverContent?.turnComplete) {
             waitingForResponseRef.current = false;
             stopSilenceStream(); 
             if (quickReleaseTimerRef.current) clearTimeout(quickReleaseTimerRef.current);
             if (!isAiSpeakingRef.current) setInspectorMessage("Ready");
         }
    }, [queueAudio]);

    // Forward declaration to break dependency cycle
    let stopAudioImplWrapper: (full: boolean) => Promise<void>;

    const {
        connectionState,
        connect,
        disconnect,
        switchLanguage,
        reconnect,
        sendPayload,
        setSleep,
        setDisconnected
    } = useConnectionManager({
        onMessage: handleGeminiMessage,
        onConnect: () => {
            setInspectorMessage("Listening...");
            resetAutoStandby(); 
        },
        onDisconnect: (fullDisconnect) => {
            // If the socket closed unexpectedly (not user initiated), we should clean up
            if (!isManuallyStoppedRef.current && !fullDisconnect) {
                console.warn("Unexpected Disconnect - Cleaning up resources");
                setInspectorMessage("Connection Lost");
                if (stopAudioImplWrapper) stopAudioImplWrapper(true);
            }
        },
        onError: (e) => {
             if (e instanceof Error && e.message.includes("429")) setInspectorMessage("Rate Limit");
        }
    });

    const {
        start: startRecorder,
        stop: stopRecorder,
        setMute: setRecorderMute,
        setEnvironment: setRecorderEnvironment,
        analyserRef,
        metrics: recorderMetrics
    } = useAudioRecorder({
        onAudioData: useCallback((payload) => {
            // "Buffer Flushed" or "Stream Data"
            
            // Check suppression
            if (isInputMuted || isMutexLockedRef.current) return;

            // Visual feedback
            isUploadingRef.current = true;
            setTimeout(() => { isUploadingRef.current = false; }, 300);

            // Send to Gemini
            sendPayload(payload);
            
            // Post-send logic (Simultaneous)
            waitingForResponseRef.current = true;
            ignoreAudioResponseRef.current = false;
            startSilenceStream();
            
            resetAutoStandby(); 

            // Watchdogs
            if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = setTimeout(() => {
                if (waitingForResponseRef.current) {
                    waitingForResponseRef.current = false;
                    stopSilenceStream();
                    setInspectorMessage("Watchdog Reset");
                }
            }, 15000);
        }, [isInputMuted, sendPayload]),
        
        onVadChange: useCallback((prob) => {
            if (prob > 0.3) resetAutoStandby();
        }, [])
    });

    // --- LOGIC ---

    useEffect(() => {
        setRecorderMute(isInputMuted);
    }, [isInputMuted, setRecorderMute]);

    useEffect(() => {
        const unsub = gatewayService.onMutexChange((state, owner) => {
            setMutexState(state);
            setMutexOwner(owner);
            isMutexLockedRef.current = (state === 'LOCKED');
            if (state === 'LOCKED') setInspectorMessage(`Yield to: ${owner}`);
            else setInspectorMessage("Line Open");
        });
        return unsub;
    }, []);

    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) {}
        }
    };
    
    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
        }
    };

    const stopSilenceStream = useCallback(() => {
        if (silenceStreamIntervalRef.current) {
            clearInterval(silenceStreamIntervalRef.current);
            silenceStreamIntervalRef.current = null;
        }
    }, []);

    const startSilenceStream = useCallback(() => {
        stopSilenceStream();
        silenceStreamIntervalRef.current = setInterval(() => {
            if (waitingForResponseRef.current && !isAiSpeakingRef.current) {
                 const silenceSamples = 2048; 
                 const silence = new Float32Array(silenceSamples).fill(0);
                 sendPayload({ media: createPcmBlob(silence) });
            } else {
                stopSilenceStream();
            }
        }, 100);
    }, [sendPayload, stopSilenceStream]);

    // ORCHESTRATOR STOP
    const stopAudioImpl = useCallback(async (fullDisconnect: boolean = true) => {
        stopSilenceStream();
        stopPlayer();
        stopRecorder(); // Stop Input (Handles VAD stop)
        
        // Only call disconnect if we aren't already handling a disconnect callback loop
        // But useConnectionManager's disconnect is safe to call repeatedly
        await disconnect(); 

        if (fullDisconnect) {
            isManuallyStoppedRef.current = true;
            releaseWakeLock();
            setDisconnected();
            if (connectionState !== 'DISCONNECTED') {
                 setInspectorMessage("Disconnected");
            }
        } else {
            setSleep();
            setInspectorMessage("Auto-Standby (Listening...)");
        }

        waitingForResponseRef.current = false;
        ignoreAudioResponseRef.current = false;
        isUploadingRef.current = false;
        setIsPaused(false);
        setIsInputMuted(false); 
        pendingLanguageRef.current = null;
    }, [stopSilenceStream, stopPlayer, stopRecorder, disconnect, setDisconnected, setSleep, connectionState]);

    // Assign wrapper for use in closures/callbacks
    stopAudioImplWrapper = stopAudioImpl;

    const resetAutoStandby = useCallback(() => {
        if (autoStandbyTimerRef.current) clearTimeout(autoStandbyTimerRef.current);
        if (connectionState === 'CONNECTED') {
            autoStandbyTimerRef.current = setTimeout(() => {
                stopAudioImpl(false); // Enter Sleep Mode
            }, 60000); 
        }
    }, [stopAudioImpl, connectionState]);

    const togglePause = () => setIsPaused(prev => !prev);
    const toggleInputMute = () => setIsInputMuted(prev => !prev);

    const executeLanguageSwitch = useCallback(async (newLang: Language) => {
        pendingLanguageRef.current = null;
        stopPlayer(); 
        ignoreAudioResponseRef.current = true;
        setInspectorMessage(`Switching to ${newLang}...`);
        await switchLanguage(newLang);
        setInspectorMessage(`Swapped: ${newLang}`);
        ignoreAudioResponseRef.current = false;
        resetAutoStandby();
    }, [stopPlayer, switchLanguage, resetAutoStandby]);

    const setLanguage = useCallback(async (newLang: Language) => {
        if (connectionState === 'DISCONNECTED') return;
        if (isAiSpeakingRef.current) {
            pendingLanguageRef.current = newLang;
            setInspectorMessage(`Queueing switch to ${newLang}...`);
        } else {
            executeLanguageSwitch(newLang);
        }
    }, [executeLanguageSwitch, connectionState]);

    const setEnvironment = useCallback((env: AcousticEnvironment) => {
        setRecorderEnvironment(env);
    }, [setRecorderEnvironment]);

    // ORCHESTRATOR START
    const startSession = async (
        selectedLanguage: Language, 
        selectedMode: TranslationMode, 
        selectedTempo: TranslationTempo, 
        selectedMicId: string, 
        selectedTriggerMicId: string, 
        selectedSpeakerId: string,
        selectedEnvironment: AcousticEnvironment // Add Env
    ) => {
        try {
            isManuallyStoppedRef.current = false;
            requestWakeLock();
            
            // 1. Output Setup
            await ensureOutputContext();
            if (selectedSpeakerId) await setSinkId(selectedSpeakerId);
            
            // 2. Input Setup
            setRecorderEnvironment(selectedEnvironment); // Set Env
            setInspectorMessage("Initializing Input...");
            await startRecorder(selectedMicId, selectedMode, () => {
                if (isManuallyStoppedRef.current) return;
                if (connectionState === 'SLEEP') reconnect();
            });

            // 3. Connection Setup
            setInspectorMessage("Connecting...");
            await connect(selectedLanguage, selectedMode, selectedTempo);

        } catch (err) {
            console.error("Session Start Failed", err);
            await stopAudioImpl(false); 
        }
    };

    // Dashboard Loop
    useEffect(() => {
        const interval = setInterval(() => {
            let lightState: 'OPEN' | 'TALK' | 'PAUSE' | 'SLEEP' | 'LOCKED' = 'OPEN';
            
            if (isMutexLockedRef.current) lightState = 'LOCKED';
            else if (connectionState === 'SLEEP') lightState = 'SLEEP';
            else if (isPaused) lightState = 'PAUSE';
            else if (isAiSpeakingRef.current || waitingForResponseRef.current) lightState = 'TALK';
            
            const outputQ = getOutputLag();
            const inputQ = recorderMetrics.bufferSize * 0.02; // Approx time per chunk
            const total = outputQ + inputQ;
            setTotalLag(total);
            
            lagHistoryRef.current.push({ time: Date.now(), val: total });
            if (lagHistoryRef.current.length > 20) lagHistoryRef.current.shift();
            
            // Trend Calculation
            if (lagHistoryRef.current.length > 5) {
                const start = lagHistoryRef.current[0];
                const end = lagHistoryRef.current[lagHistoryRef.current.length - 1];
                const slope = (end.val - start.val) / ((end.time - start.time) / 1000);
                if (slope > 0.5) setLagTrend('RISING');
                else if (slope < -0.5) setLagTrend('FALLING');
                else setLagTrend('STABLE');
            }

            setAiEfficiency(Math.max(0, 100 - (total * 10)));

            setDashboardState({
                 rms: recorderMetrics.rms,
                 vadProb: recorderMetrics.vadProb,
                 isGated: recorderMetrics.vadProb < 0.3,
                 trafficLight: lightState,
                 bufferSize: recorderMetrics.bufferSize,
                 outputQueueSize: outputQ,
                 isUploading: isUploadingRef.current
            });

        }, 100);
        return () => clearInterval(interval);
    }, [connectionState, isPaused, getOutputLag, recorderMetrics]);

    useEffect(() => {
        return () => { stopAudioImpl(true); };
    }, []);

    return {
        connectionState,
        isAiSpeaking,
        isPaused,
        togglePause,
        isInputMuted,
        toggleInputMute,
        mutexState,
        mutexOwner,
        startSession,
        endSession: stopAudioImpl, 
        setLanguage,
        setEnvironment, // Expose
        audioOutputElRef,
        analyserRef,
        dashboardState,
        lastBurstSize,
        inspectorMessage,
        aiEfficiency,
        totalLag,
        lagTrend
    };
};