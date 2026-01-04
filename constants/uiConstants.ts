
import { UIText } from '../types';

// DEFAULT IS NOW SWEDISH (MASTER SOURCE)
export const DEFAULT_UI_TEXT: UIText = {
  dashboard: {
    yourLanguageLabel: "Vilket är ditt språk?",
    modeLabel: "När ska talaren och tolken prata?",
    modeSimultaneous: "Samtidigt",
    modeTakeTurns: "Turas om att prata",
    tempoLabel: "Tempo & Stil",
    envLabel: "Akustisk Miljö",
    envSmall: "Liten Grupp (Boost)",
    envLarge: "Stor Grupp (PA)",
    tempoStandard: "Standard",
    tempoFast: "Snabb",
    tempoPresentation: "Presentation",
    textModeLabel: "", 
    pinPlaceholder: "PIN",
    micLabel: "Mikrofoningång",
    triggerLabel: "Triggeringång (Tillval)",
    speakerLabel: "Ljudutgång (Högtalare)",
    statusReady: "Redo att ansluta",
    statusListening: "Lyssnar...",
    statusTranslating: "Översätter...",
    statusPaused: "TRYCK FÖR ATT STARTA",
    buttonStart: "GÅ LIVE",
    buttonStop: "TYSTA (VILOLÄGE)",
    
    // Consistent Swedish Translations
    detailsLabel: "Detaljer",
    toggleDetailsMore: "Tryck för att visa mer",
    toggleDetailsLess: "Tryck för att visa mindre",
    showMetrics: "Visa systemvärden",
    hostButton: "Mötesvärd",
    gatewayConnected: "GATEWAY: ANSLUTEN",
    gatewayDisconnected: "GATEWAY: FRÅNKOPPLAD / FEL",
    metricsTitle: "Systemvärden"
  },
  loadingOverlay: {
    translating: "Översätter gränssnitt..."
  },
  languageStep: {
    title: "Välj Språk",
    subtitle: "Välj det språk du vill höra.",
    yourLanguageLabel: "Ditt Språk",
    nextButton: "Nästa"
  },
  modeStep: {
    title: "Välj Läge",
    subtitleTemplate: "Hur vill du översätta till {{lang}}?",
    categoryConversationalTitle: "Konversation",
    categoryConversationalDesc: "Turas om att tala.",
    subOptionSequential: "Sekventiell",
    subOptionFluid: "Flytande",
    subOptionPresentation: "Presentation",
    categorySimultaneousTitle: "Simultan",
    categorySimultaneousDesc: "Översätt medan du lyssnar.",
    subOptionAudio: "Ljud",
    subOptionText: "Text",
    pinPrompt: "Ange PIN",
    pinError: "Felaktig PIN",
    backButton: "Tillbaka",
    nextButton: "Nästa"
  },
  groupStep: {
    title: "Akustisk Miljö",
    subtitle: "Optimera mikrofonens känslighet.",
    smallTitle: "Liten Grupp",
    smallDesc: "Mjukvaruboost",
    smallDetail: "Digital förförstärkare aktiverad. Bäst för tysta rum.",
    largeTitle: "Stor Grupp",
    largeDesc: "Hårdvaru-AGC",
    largeDetail: "Använder enhetens automatisk förstärkning. Bäst för högljudda rum/PA.",
    backButton: "Tillbaka",
    nextButton: "Nästa"
  },
  sessionStep: {
    title: "Aktiv Session"
  },
  audioStep: {
    title: "Ljudinställningar",
    subtitle: "Välj dina in- och utenheter.",
    micLabel: "Mikrofon",
    triggerLabel: "Triggermikrofon",
    triggerDesc: "Valfri sekundär mikrofon för VAD-styrning.",
    speakerLabel: "Högtalare",
    backButton: "Tillbaka",
    startButton: "Starta Session"
  },
  hostStep: {
    title: "Värdadmin",
    connectLabel: "Gateway URL",
    statusLabel: "Status",
    targetLabel: "NDI Mål",
    switchButton: "Växla",
    backButton: "Stäng"
  }
};