
import { useRef, useCallback, useEffect, useState } from 'react';
import { TranslationMode, OUTPUT_SAMPLE_RATE } from '../types';
import { base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';

interface UseAudioPlayerProps {
    onAiSpeakingChange?: (isSpeaking: boolean) => void;
    onPlaybackEnded?: () => void;
}

export const useAudioPlayer = ({ onAiSpeakingChange, onPlaybackEnded }: UseAudioPlayerProps = {}) => {
    // Refs
    const audioQueueRef = useRef<{data: Uint8Array, mode: TranslationMode}[]>([]);
    const isProcessingQueueRef = useRef(false);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // Contexts & Nodes
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    const audioOutputElRef = useRef<HTMLAudioElement>(null);
    
    // Timers
    const aiSpeechDebounceTimerRef = useRef<any>(null);

    // Initialize Audio Context
    const ensureContext = useCallback(async () => {
        // 1. Create Context if missing or closed
        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            mediaStreamDestRef.current = outputAudioContextRef.current.createMediaStreamDestination();
        }

        // 2. Resume if suspended
        if (outputAudioContextRef.current.state === 'suspended') {
            try { await outputAudioContextRef.current.resume(); } catch(e) { console.warn("Context resume failed", e); }
        }

        // 3. Ensure Audio Element is connected
        if (audioOutputElRef.current && mediaStreamDestRef.current) {
            // Re-attach if lost
            if (audioOutputElRef.current.srcObject !== mediaStreamDestRef.current.stream) {
                 audioOutputElRef.current.srcObject = mediaStreamDestRef.current.stream;
                 console.log("Re-attached Audio Element srcObject");
            }
            
            // Ensure element is playing
            if (audioOutputElRef.current.paused) {
                try {
                    await audioOutputElRef.current.play();
                } catch (e) {
                    console.warn("Audio Element Autoplay blocked. Attempting to force reset...", e);
                    // Force reset srcObject to trigger reload
                    const stream = mediaStreamDestRef.current.stream;
                    audioOutputElRef.current.srcObject = null;
                    audioOutputElRef.current.srcObject = stream;
                    try { await audioOutputElRef.current.play(); } catch(e2) { console.error("Force play failed", e2); }
                }
            }
        }

        return outputAudioContextRef.current;
    }, []);

    const playRawAudio = async (audioData: Uint8Array, mode?: TranslationMode) => {
        try {
            const ctx = await ensureContext();
            
            // Scheduling Logic
            const currentTime = ctx.currentTime;
            if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
            }
            
            // Drift correction
            if (nextStartTimeRef.current > currentTime + 20) {
                nextStartTimeRef.current = currentTime;
            }

            const audioBuffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;

            // Adaptive Playback Rate
            const outputQ = Math.max(0, nextStartTimeRef.current - currentTime);
            let rate = 1.0;
            if (outputQ > 15.0) {
                rate = 1.1; 
            }
            source.playbackRate.value = rate;

            // Routing logic
            if ('setSinkId' in HTMLMediaElement.prototype && mediaStreamDestRef.current) {
                 source.connect(mediaStreamDestRef.current);
            } else {
                 source.connect(ctx.destination);
            }

            source.onended = () => {
                try { source.stop(); } catch(e) {}
                source.disconnect();
                sourcesRef.current.delete(source);

                if (sourcesRef.current.size === 0) {
                    if (aiSpeechDebounceTimerRef.current) clearTimeout(aiSpeechDebounceTimerRef.current);
                    aiSpeechDebounceTimerRef.current = setTimeout(() => {
                        if (onAiSpeakingChange) onAiSpeakingChange(false);
                        if (onPlaybackEnded) onPlaybackEnded();
                    }, 150);
                }
            };

            const duration = audioBuffer.duration / rate;
            source.start(nextStartTimeRef.current);
            sourcesRef.current.add(source);
            nextStartTimeRef.current += duration;

            // Trigger State
            if (aiSpeechDebounceTimerRef.current) clearTimeout(aiSpeechDebounceTimerRef.current);
            if (onAiSpeakingChange) onAiSpeakingChange(true);
            
        } catch (e) {
            console.error("Audio Playback Failed", e);
        }
    };

    const processQueue = async () => {
        if (isProcessingQueueRef.current) return;
        isProcessingQueueRef.current = true;
        try {
            while (audioQueueRef.current.length > 0) {
                const item = audioQueueRef.current.shift();
                if (item) {
                     await playRawAudio(item.data, item.mode);
                }
            }
        } catch (e) {
            console.error("Playback Error", e);
        } finally {
            isProcessingQueueRef.current = false;
        }
    };

    const queueAudio = useCallback((base64Data: string, mode: TranslationMode) => {
        const audioData = base64ToUint8Array(base64Data);
        audioQueueRef.current.push({ data: audioData, mode });
        
        // Safety cap
        if (audioQueueRef.current.length > 50) {
            audioQueueRef.current.shift();
        }
        
        processQueue();
    }, [ensureContext]);

    const stopAudio = useCallback(async () => {
        if (aiSpeechDebounceTimerRef.current) clearTimeout(aiSpeechDebounceTimerRef.current);
        
        // Stop all active sources
        sourcesRef.current.forEach(source => {
            try {
                source.onended = null;
                source.stop();
                source.disconnect();
            } catch (e) {}
        });
        sourcesRef.current.clear();

        // Pause the audio element but DO NOT clear srcObject
        if (audioOutputElRef.current) {
            audioOutputElRef.current.pause();
        }

        audioQueueRef.current = [];
        isProcessingQueueRef.current = false;
        nextStartTimeRef.current = 0;
        
        if (onAiSpeakingChange) onAiSpeakingChange(false);
        
    }, []);

    const setSinkId = useCallback(async (deviceId: string) => {
        if (audioOutputElRef.current && 'setSinkId' in HTMLMediaElement.prototype) {
            try {
                // @ts-ignore
                await audioOutputElRef.current.setSinkId(deviceId);
            } catch (err) {
                console.warn("Failed to set Sink ID", err);
            }
        }
    }, []);

    const getOutputLag = useCallback(() => {
        if (!outputAudioContextRef.current) return 0;
        return Math.max(0, nextStartTimeRef.current - outputAudioContextRef.current.currentTime);
    }, []);

    return {
        queueAudio,
        stopAudio,
        setSinkId,
        ensureContext,
        getOutputLag,
        audioOutputElRef,
        outputAudioContextRef
    };
};
