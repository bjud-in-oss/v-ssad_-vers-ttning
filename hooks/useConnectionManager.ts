
import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveServerMessage } from '@google/genai';
import { Language, TranslationMode, TranslationTempo } from '../types';
import { geminiService } from '../services/geminiLiveService';

export type ConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'SLEEP' | 'RECONNECTING' | 'CONNECTING';

interface UseConnectionManagerProps {
    onMessage: (message: LiveServerMessage, mode: TranslationMode) => Promise<void>;
    onConnect?: () => void;
    onDisconnect?: (fullDisconnect: boolean) => void; // boolean indicates if it's a full stop or just a socket close
    onError?: (error: any) => void;
}

export const useConnectionManager = ({ onMessage, onConnect, onDisconnect, onError }: UseConnectionManagerProps) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
    const connectionStateRef = useRef<ConnectionState>('DISCONNECTED');
    const sessionRef = useRef<any>(null);
    
    // Config needed for rotation/reconnect
    const lastConfigRef = useRef<{
        lang: Language;
        mode: TranslationMode;
        tempo: TranslationTempo;
    } | null>(null);

    const autoRotateTimerRef = useRef<any>(null);
    
    useEffect(() => {
        connectionStateRef.current = connectionState;
    }, [connectionState]);

    const stopRotationTimer = useCallback(() => {
        if (autoRotateTimerRef.current) {
            clearTimeout(autoRotateTimerRef.current);
            autoRotateTimerRef.current = null;
        }
    }, []);

    const disconnect = useCallback(async () => {
         stopRotationTimer();
         if (sessionRef.current) {
             try { await geminiService.disconnect(); } catch(e) {}
             sessionRef.current = null;
         }
         // Note: We don't strictly set DISCONNECTED here, usually the caller does or we rely on events
    }, [stopRotationTimer]);

    const scheduleRotation = useCallback(() => {
        stopRotationTimer();
        autoRotateTimerRef.current = setTimeout(async () => {
             await rotateSession();
        }, 12 * 60 * 1000); // 12 minutes
    }, []);

    const rotateSession = useCallback(async () => {
        if (connectionStateRef.current !== 'CONNECTED' || !lastConfigRef.current) return;
        
        const oldSession = sessionRef.current;
        const { lang, mode, tempo } = lastConfigRef.current;
        
        try {
            const newSession = await geminiService.connect(
                lang,
                mode,
                tempo,
                () => { }, // onOpen
                async (message: LiveServerMessage) => {
                    await onMessage(message, mode);
                },
                (e) => console.warn("Rotated Session Error", e),
                () => console.log("Rotated Session Closed")
            );
            
            // Only update session if rotation was successful
            if (newSession) {
                sessionRef.current = newSession;
                if (oldSession) oldSession.close();
                scheduleRotation();
            }
        } catch (e) {
            console.error("Rotation Failed", e);
            if (onError) onError(e);
        }
    }, [onMessage, onError, scheduleRotation]);

    const connect = useCallback(async (
        lang: Language, 
        mode: TranslationMode, 
        tempo: TranslationTempo
    ) => {
        // Store config
        lastConfigRef.current = { lang, mode, tempo };
        
        // Set state immediately to UI can react (disable buttons)
        setConnectionState('CONNECTING');

        // Clean up existing
        if (sessionRef.current) {
            await geminiService.disconnect();
            sessionRef.current = null;
        }

        try {
            const session = await geminiService.connect(
                lang, mode, tempo,
                () => {
                    setConnectionState('CONNECTED');
                    scheduleRotation();
                    if (onConnect) onConnect();
                },
                async (msg) => {
                    await onMessage(msg, mode);
                },
                (err) => {
                    if (err instanceof Error && err.message.includes("429")) {
                        // Rate limit handling could be improved here
                    }
                    setConnectionState('DISCONNECTED'); // Fallback
                    if (onError) onError(err);
                },
                () => {
                    // If we are RECONNECTING (swapping lang), ignore the close event of the old session
                    if (connectionStateRef.current !== 'RECONNECTING' && connectionStateRef.current !== 'CONNECTING') {
                        // CRITICAL: Ensure we mark state as DISCONNECTED if it closes unexpectedly
                        setConnectionState('DISCONNECTED');
                        if (onDisconnect) onDisconnect(false);
                    }
                }
            );
            
            if (session) {
                sessionRef.current = session;
            } else {
                // If session is null (e.g. aborted), ensure we reset to disconnected
                setConnectionState('DISCONNECTED');
            }
        } catch (e) {
            console.error("Connection Failed", e);
            setConnectionState('DISCONNECTED');
            if (onError) onError(e);
            throw e; 
        }
    }, [onMessage, onConnect, onDisconnect, onError, scheduleRotation]);

    const switchLanguage = useCallback(async (newLang: Language) => {
        if (!lastConfigRef.current) return;
        
        const { mode, tempo } = lastConfigRef.current;
        lastConfigRef.current.lang = newLang; 

        setConnectionState('RECONNECTING');
        
        if (sessionRef.current) {
            try { await geminiService.disconnect(); } catch (e) {}
        }

        try {
            await connect(newLang, mode, tempo);
        } catch (e) {
            if (onDisconnect) onDisconnect(true);
        }
    }, [connect, onDisconnect]);

    const sendPayload = useCallback((payload: any) => {
        if (sessionRef.current) {
            try { sessionRef.current.sendRealtimeInput(payload); } catch (e) {}
        }
    }, []);

    const reconnect = useCallback(async () => {
        if (lastConfigRef.current && connectionStateRef.current === 'SLEEP') {
            setConnectionState('RECONNECTING');
            await connect(
                lastConfigRef.current.lang,
                lastConfigRef.current.mode,
                lastConfigRef.current.tempo
            );
        }
    }, [connect]);

    const setSleep = useCallback(() => {
        setConnectionState('SLEEP');
    }, []);
    
    const setDisconnected = useCallback(() => {
        setConnectionState('DISCONNECTED');
    }, []);

    return {
        connectionState,
        connect,
        disconnect,
        switchLanguage,
        reconnect,
        sendPayload,
        setSleep,
        setDisconnected,
        sessionRef
    };
};
