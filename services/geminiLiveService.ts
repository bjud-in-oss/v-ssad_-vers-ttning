
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language, TranslationMode, TranslationTempo } from '../types';
import { storageService } from './storageService';
import { RAG_CONTEXT_MD } from '../specs/rag_context';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private isConnecting: boolean = false;
  private abortPending: boolean = false; // Flag to kill connection if user cancels
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(
    targetLanguage: Language,
    mode: TranslationMode,
    tempo: TranslationTempo,
    onOpen: () => void,
    onMessage: (message: LiveServerMessage) => void,
    onError: (e: ErrorEvent) => void,
    onClose: (e: CloseEvent) => void
  ): Promise<any> {
    
    // Prevent race conditions with a lock
    if (this.isConnecting) {
        console.warn("GeminiLiveService: Connection already in progress. Ignoring request.");
        return null;
    }
    
    this.isConnecting = true;
    this.abortPending = false;

    // Ensure no ghost sessions exist
    if (this.session) {
        await this.disconnect();
    }

    try {
        let systemInstruction = "";

        // Strictly defined bi-directional rules
        const baseInstruction = `You are a professional bi-directional interpreter acting as a bridge between Swedish and ${targetLanguage}.

        CRITICAL RULES:
        1. LISTEN: Identify if the incoming audio is Swedish or ${targetLanguage}.
        2. TRANSLATE:
           - If input is SWEDISH -> You MUST translate to ${targetLanguage.toUpperCase()}.
           - If input is ${targetLanguage.toUpperCase()} -> You MUST translate to SWEDISH.
        3. BEHAVIOR:
           - Do NOT answer the user's questions. Only translate what they said.
           - Do NOT reply in the same language as the input. ALWAYS switch languages.
        `;

        // 1. MODE INSTRUCTIONS (Architecture)
        if (mode === TranslationMode.SEQUENTIAL || mode === TranslationMode.FLUID || mode === TranslationMode.PRESENTATION) {
          systemInstruction = `${baseInstruction}
          
          MODE: CONVERSATIONAL (TURNS)
          - WAIT until the speaker has completely finished their sentence (detect silence) before speaking.
          - Do NOT interrupt.`;
          
        } else if (mode === TranslationMode.SIMULTANEOUS) {
          systemInstruction = `${baseInstruction}
          
          MODE: SIMULTANEOUS (SEMI-DUPLEX STREAMING)
          - You are working in a SEMI-TRUE MULTI-DUPLEX dialog setup.
          - Your goal is to keep the flow moving. Do not wait for long pauses.
          - Translate short bursts immediately as you understand them.
          - Keep output CONCISE and DIRECT to minimize latency.
          - If the speakers overlap, prioritize the dominant voice but try to capture the essence.
          - CRITICAL: Maintain bi-directional awareness. Even in simultaneous mode, switch direction immediately if the language changes (Dialog Mode).`;
        }

        // 2. TEMPO INSTRUCTIONS (Style)
        let effectiveTempo = tempo;
        if (mode === TranslationMode.FLUID) effectiveTempo = 'fast';
        if (mode === TranslationMode.PRESENTATION) effectiveTempo = 'presentation';

        if (effectiveTempo === 'fast') {
            systemInstruction += `\n
            STYLE: FAST / FLUID
            - Speak significantly FASTER than normal conversation. Be concise.
            - Translate continuously in small segments.
            - Sacrifice some grammar/formality for speed if necessary.`;
        } else if (effectiveTempo === 'presentation') {
            systemInstruction += `\n
            STYLE: PRESENTATION / SHADOWING
            - Act as a Shadow Interpreter for a sermon or speech.
            - PRIORITY: Preserve the speaker's tone, emotion, and solemnity.
            - Maintain a calm, steady flow. Finish your thought even if new audio is coming in.`;
        } else {
            // Standard
            systemInstruction += `\n
            STYLE: STANDARD
            - Use a natural, conversational tone.
            - Prioritize accuracy and clarity.`;
        }

        // --- RAG CONTEXT INJECTION (TASK 13) ---
        let ragContent = "";
        try {
            const savedSpecs = await storageService.loadSpecs();
            if (savedSpecs) {
                 Object.keys(savedSpecs).forEach(key => {
                     if (key.startsWith('rag_') || key.startsWith('context/')) {
                         ragContent += `\n\n--- ${key} ---\n${savedSpecs[key]}`;
                     }
                 });
            }
        } catch (e) {
            console.warn("Could not load RAG from DB", e);
        }

        if (!ragContent.trim()) {
             ragContent = `\n\n--- rag_context.md ---\n${RAG_CONTEXT_MD}`;
        }

        systemInstruction += `\n\n# CONTEXT & TERMINOLOGY (RAG)
        IMPORTANT: The content below contains terminology and liturgical texts (prayers) for reference.
        - USE them to ensure correct terminology.
        - DO NOT substitute the speaker's actual words with these texts unless they are reading them verbatim.
        - IF the speaker prays a prayer that is SIMILAR but NOT IDENTICAL to a text below, TRANSLATE WHAT THEY SAY. Do not force the reference text.
        
        ${ragContent}`;
        // ----------------------------------------

        const sessionPromise = this.ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: onOpen,
            onmessage: onMessage,
            onerror: onError,
            onclose: onClose,
          },
          config: {
            responseModalities: [Modality.AUDIO], 
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: systemInstruction,
          },
        });

        const session = await sessionPromise;
        
        // CHECK FOR ABORT (If user clicked Stop while we were connecting)
        if (this.abortPending) {
             console.log("GeminiLiveService: Connection aborted by user.");
             session.close();
             this.session = null;
             return null;
        }

        this.session = session;
        return this.session;

    } catch (error) {
        this.isConnecting = false;
        throw error;
    } finally {
        this.isConnecting = false;
    }
  }

  async disconnect() {
    this.abortPending = true; // Signal pending connections to stop
    if (this.session) {
      try {
        this.session.close();
      } catch (error) {
        console.warn("Error closing Gemini session:", error);
      }
      this.session = null;
    }
    this.isConnecting = false; // Release lock
  }
}

export const geminiService = new GeminiLiveService();