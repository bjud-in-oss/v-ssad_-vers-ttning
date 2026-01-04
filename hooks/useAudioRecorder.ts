
import { useRef, useState, useCallback, useEffect } from 'react';
import { TranslationMode, INPUT_SAMPLE_RATE, AcousticEnvironment } from '../types';
import { vadService } from '../services/vadService';
import { gatewayService } from '../services/gatewayService';
import { createPcmBlob, concatenateFloat32Arrays } from '../utils/audioUtils';

interface UseAudioRecorderProps {
    onAudioData: (blob: any) => void; // Send payload to ConnectionManager
    onVadChange?: (prob: number) => void;
}

export const useAudioRecorder = ({ onAudioData, onVadChange }: UseAudioRecorderProps) => {
    // Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gatewaySourceRef = useRef<MediaStreamAudioDestinationNode | null>(null);
    
    // Buffers for Simultaneous Mode
    const localBufferRef = useRef<Float32Array[]>([]);
    const lookbackBufferRef = useRef<Float32Array[]>([]);
    
    // State / Logic Refs
    const isGateOpenRef = useRef<boolean>(false);
    const lowVolumeStartRef = useRef<number>(0);
    const lastRmsRef = useRef<number>(0);
    const isRecordingRef = useRef<boolean>(false);
    
    // Gateway Unsubscribe
    const gatewayUnsubRef = useRef<(() => void) | null>(null);
    
    // Config Refs (mutable for the processor loop)
    const configRef = useRef({
        mode: TranslationMode.SIMULTANEOUS,
        isMuted: false,
        micId: 'default',
        environment: 'large-group' as AcousticEnvironment
    });

    const [metrics, setMetrics] = useState({
        rms: 0,
        vadProb: 0,
        bufferSize: 0
    });

    // --- METHODS ---

    const setupContext = useCallback(async () => {
        if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
                sampleRate: INPUT_SAMPLE_RATE 
            });
        }
        if (inputAudioContextRef.current.state === 'suspended') {
            await inputAudioContextRef.current.resume();
        }
        return inputAudioContextRef.current;
    }, []);

    const stop = useCallback(() => {
        isRecordingRef.current = false;
        
        // Stop VAD
        vadService.stop();

        // Stop Gateway Listener
        if (gatewayUnsubRef.current) {
            gatewayUnsubRef.current();
            gatewayUnsubRef.current = null;
        }

        // Stop Tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Disconnect Nodes
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        
        // Close Context (Optional, can keep warm)
        // inputAudioContextRef.current?.close();

        // Clear Buffers
        localBufferRef.current = [];
        lookbackBufferRef.current = [];
        isGateOpenRef.current = false;
        lowVolumeStartRef.current = 0;
        
        setMetrics(m => ({ ...m, rms: 0, vadProb: 0, bufferSize: 0 }));
    }, []);

    const handleGatewayAudio = useCallback((data: ArrayBuffer) => {
        const ctx = inputAudioContextRef.current;
        if (!ctx || !gatewaySourceRef.current) return;
        
        // Convert and downsample if needed (Assuming Gateway sends Float32 48k or similar, we need to match context)
        const inputFloat32 = new Float32Array(data);
        const outputLength = Math.floor(inputFloat32.length / 3); // Simple 48->16 decimation approximation
        const downsampled = new Float32Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
            downsampled[i] = inputFloat32[i * 3];
        }
        
        const buffer = ctx.createBuffer(1, downsampled.length, INPUT_SAMPLE_RATE);
        buffer.copyToChannel(downsampled, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gatewaySourceRef.current);
        source.start();
    }, []);

    const flushBuffer = useCallback(() => {
        const bufferSizeChunks = localBufferRef.current.length;
        if (bufferSizeChunks > 0) {
            const combined = concatenateFloat32Arrays(localBufferRef.current);
            const pcmBlob = createPcmBlob(combined);
            onAudioData({ media: pcmBlob }); // Send blob
            
            localBufferRef.current = [];
        }
    }, [onAudioData]);

    const start = useCallback(async (
        micId: string,
        mode: TranslationMode,
        onStart?: () => void
    ) => {
        try {
            stop(); // Ensure clean start
            const ctx = await setupContext();
            
            configRef.current.micId = micId;
            configRef.current.mode = mode;
            isRecordingRef.current = true;

            let stream: MediaStream;
            let isGatewayAudio = micId === 'gateway';

            if (isGatewayAudio && gatewayService.getStatus() === 'CONNECTED') {
                gatewaySourceRef.current = ctx.createMediaStreamDestination();
                stream = gatewaySourceRef.current.stream;
                
                // Unsubscribe handled by stop()
                gatewayUnsubRef.current = gatewayService.onAudio(handleGatewayAudio);
            } else {
                const constraints: MediaStreamConstraints = { 
                    audio: {
                        deviceId: micId && micId !== 'default' ? { exact: micId } : undefined,
                        echoCancellation: true, 
                        noiseSuppression: true, 
                        autoGainControl: true // Always true for now, we manipulate digitally
                    } 
                };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            streamRef.current = stream;

            // Initialize VAD
            await vadService.attach(
                stream,
                () => { /* Speech Start */ },
                () => { 
                    // Speech End
                    if (configRef.current.mode === TranslationMode.SIMULTANEOUS) {
                         flushBuffer();
                    }
                }
            );

            // Setup Processor Loop
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            // RESET STATE
            localBufferRef.current = [];
            lookbackBufferRef.current = [];
            isGateOpenRef.current = false;
            lowVolumeStartRef.current = 0;
            
            const BURST_THRESHOLD_CHUNKS = 12; 

            processor.onaudioprocess = (e) => {
                if (!isRecordingRef.current) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                const isMuted = configRef.current.isMuted;
                const env = configRef.current.environment;
                
                // --- DIGITAL GAIN LOGIC ---
                // Small Group = Boost (Pre-Amp)
                // Large Group = Unity Gain
                const gain = env === 'small-group' ? 2.5 : 1.0;
                
                const amplifiedData = new Float32Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                     if (isMuted) {
                         amplifiedData[i] = 0;
                     } else {
                         // Apply gain then soft clip
                         amplifiedData[i] = Math.tanh(inputData[i] * gain);
                     }
                }

                // RMS Calculation
                let sum = 0;
                for (let i = 0; i < amplifiedData.length; i++) sum += amplifiedData[i] * amplifiedData[i];
                const rms = Math.sqrt(sum / amplifiedData.length);
                lastRmsRef.current = rms;

                const vadProb = vadService.getProbability();
                if (onVadChange) onVadChange(vadProb);

                // --- MODE LOGIC ---
                const currentMode = configRef.current.mode;
                
                if (currentMode === TranslationMode.SIMULTANEOUS) {
                    // Buffering Logic
                    const chunk = new Float32Array(amplifiedData);
                    lookbackBufferRef.current.push(chunk);
                    if (lookbackBufferRef.current.length > 2) lookbackBufferRef.current.shift();

                    const GATE_OPEN = 0.005;
                    if (rms > GATE_OPEN) isGateOpenRef.current = true;

                    if (!isMuted && vadProb > 0.3 && (isGateOpenRef.current || rms > GATE_OPEN)) {
                        // SPEECH DETECTED
                        if (localBufferRef.current.length === 0) localBufferRef.current.push(...lookbackBufferRef.current);
                        localBufferRef.current.push(chunk);
                        lowVolumeStartRef.current = 0;
                    } else {
                        // SILENCE
                        if (localBufferRef.current.length > 0) {
                            if (lowVolumeStartRef.current === 0) lowVolumeStartRef.current = Date.now();
                            if (Date.now() - lowVolumeStartRef.current > 1500) {
                                 flushBuffer();
                                 lowVolumeStartRef.current = 0;
                            }
                        } else {
                            lowVolumeStartRef.current = 0;
                        }
                    }
                    
                    if (localBufferRef.current.length > BURST_THRESHOLD_CHUNKS) {
                         flushBuffer();
                    }

                } else {
                    // SEQUENTIAL / FLUID (Continuous Streaming)
                    if (!isMuted) {
                        onAudioData({ media: createPcmBlob(amplifiedData) });
                    }
                }

                setMetrics({
                    rms: rms,
                    vadProb: vadProb,
                    bufferSize: localBufferRef.current.length
                });
            };

            analyser.connect(processor);
            processor.connect(ctx.destination);
            
            if (onStart) onStart();

        } catch (err) {
            console.error("Audio Recorder Start Error", err);
            stop();
        }
    }, [stop, setupContext, handleGatewayAudio, flushBuffer, onAudioData, onVadChange]);

    const setMute = useCallback((muted: boolean) => {
        configRef.current.isMuted = muted;
    }, []);
    
    const setEnvironment = useCallback((env: AcousticEnvironment) => {
        configRef.current.environment = env;
    }, []);

    return {
        start,
        stop,
        setMute,
        setEnvironment,
        analyserRef,
        metrics
    };
};