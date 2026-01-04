
import { GoogleGenAI } from '@google/genai';
import { UIText, Language } from '../types';

// Hardcoded English translations for instant switching
const ENGLISH_UI_TEXT: UIText = {
  dashboard: {
    yourLanguageLabel: "What is your language?",
    modeLabel: "When should the translator talk?",
    modeSimultaneous: "Talk immediately",
    modeTakeTurns: "Take turns talking",
    tempoLabel: "Tempo & Style",
    envLabel: "Acoustic Environment",
    envSmall: "Small Group (Boost)",
    envLarge: "Large Group (PA)",
    tempoStandard: "Standard",
    tempoFast: "Fast",
    tempoPresentation: "Presentation",
    textModeLabel: "", 
    pinPlaceholder: "PIN",
    micLabel: "Microphone Input",
    triggerLabel: "Trigger Input (Optional)",
    speakerLabel: "Audio Output (Speaker)",
    statusReady: "Ready to Connect",
    statusListening: "Listening...",
    statusTranslating: "Translating...",
    statusPaused: "PRESS TO UNMUTE",
    buttonStart: "GO LIVE",
    buttonStop: "MUTE (STANDBY)",
    
    detailsLabel: "Details",
    toggleDetailsMore: "Press to view more details",
    toggleDetailsLess: "Press to view less details",
    showMetrics: "Show System Metrics",
    hostButton: "Meeting Host",
    gatewayConnected: "GATEWAY: CONNECTED",
    gatewayDisconnected: "GATEWAY: DISCONNECTED / ERROR",
    metricsTitle: "System Metrics"
  },
  loadingOverlay: {
    translating: "Translating UI..."
  },
  languageStep: {
    title: "Select Language",
    subtitle: "Choose the language you want to hear.",
    yourLanguageLabel: "What is your language?",
    nextButton: "Next"
  },
  modeStep: {
    title: "Select Mode",
    subtitleTemplate: "How do you want to translate to {{lang}}?",
    categoryConversationalTitle: "Conversational",
    categoryConversationalDesc: "Take turns speaking.",
    subOptionSequential: "Sequential",
    subOptionFluid: "Fluid",
    subOptionPresentation: "Presentation",
    categorySimultaneousTitle: "Simultaneous",
    categorySimultaneousDesc: "Talk immediately",
    subOptionAudio: "Audio",
    subOptionText: "Text",
    pinPrompt: "Enter PIN",
    pinError: "Incorrect PIN",
    backButton: "Back",
    nextButton: "Next"
  },
  groupStep: {
    title: "Acoustic Environment",
    subtitle: "Optimize microphone sensitivity.",
    smallTitle: "Small Group",
    smallDesc: "Software Boost",
    smallDetail: "Digital Pre-Amp enabled. Best for quiet rooms.",
    largeTitle: "Large Group",
    largeDesc: "Hardware AGC",
    largeDetail: "Uses device auto-gain. Best for loud rooms/PA.",
    backButton: "Back",
    nextButton: "Next"
  },
  sessionStep: {
    title: "Aktiv Session"
  },
  audioStep: {
    title: "Audio Setup",
    subtitle: "Select your input and output devices.",
    micLabel: "Microphone",
    triggerLabel: "Trigger Mic",
    triggerDesc: "Optional secondary mic for VAD triggering.",
    speakerLabel: "Speaker",
    backButton: "Back",
    startButton: "Start Session"
  },
  hostStep: {
    title: "Host Admin",
    connectLabel: "Gateway URL",
    statusLabel: "Status",
    targetLabel: "NDI Target",
    switchButton: "Switch",
    backButton: "Close"
  }
};

export class UITranslationService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async translateUI(targetLanguage: Language, baseText: UIText): Promise<UIText> {
    // 1. If target is SWEDISH, return the BASE text (which is now Swedish by default)
    if (targetLanguage === Language.SWEDISH) return baseText;
    
    // 2. If target is ENGLISH, return the hardcoded English text
    if (targetLanguage === Language.ENGLISH) return ENGLISH_UI_TEXT;

    // 3. Otherwise, use AI to translate from Swedish base
    const prompt = `Translate the following Swedish UI text JSON structure into ${targetLanguage}. 
    Keep the keys exactly the same. Translate the values to be natural and user-friendly in ${targetLanguage}.
    Preserve short and concise phrasing suitable for buttons and labels.
    
    JSON:
    ${JSON.stringify(baseText, null, 2)}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from translation model");
      
      return JSON.parse(text) as UIText;
    } catch (error) {
      console.error("UI Translation failed:", error);
      // Fallback to base text if translation fails
      return baseText;
    }
  }
}

export const uiTranslationService = new UITranslationService();