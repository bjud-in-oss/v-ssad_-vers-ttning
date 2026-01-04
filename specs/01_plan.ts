
export const PLAN_MD = `# Projektplan: Meeting Translator

## 1. Vision & Syfte
Att skapa en **mötes tolk** för kyrkmöten som kompletterar den simultantolkande volontären och den textbaserade datortolken till många språk genom att:
1.  Översätta ljudvågorna direkt.
2.  Urskilja talare med låg-latens streaming.
3.  Ha koll på kyrkspråket.

**Kärnfilosofi:**
1.  **Enkelhet:** En URL, en knapp. Ingen installation för slutanvändaren.
2.  **Kontext:** AI:n måste kunna "kyrkspråket" (Liturgi, terminologi).
3.  **Robusthet:** Måste fungera även om nätverket svajar (Auto-reconnect, Hot Swap).

---

## 2. Arkitektur & Struktur

### Frontend (Denna App)
*   **Ramverk:** React + Vite + TypeScript.
*   **AI-Motor:** Google Gemini Live API (WebSocket / WebRTC-like).
*   **Ljud:** Web Audio API (ScriptProcessor/Worklet) för rå PCM-hantering.
*   **Design:** Single-Page Dashboard (allt på en skärm). Ingen "Wizard" längre.

### Backend (Gateway - Tillval)
*   **Språk:** C++ (för prestanda och ASIO/NDI stöd).
*   **Syfte:** Agera brygga mellan professionell ljudhårdvara (Biamp/Mixer) och webben.
*   **Protokoll:** WebSockets (JSON Control + Binary Audio).

---

## 3. Aktuell Status (Fas 4 & 5)

**Aktivt Fokus:**
*   RAG-kontext (Terminologi och Liturgi).
*   Stabilitet i Simultanöversättning (Hantera avbrott/hallucinationer).

**Kritiska Problem att lösa:**
*   **Simultant Flöde:** Just nu bryts översättningen ibland eller "tystnar" mitt i meningar vid simultanläge. Detta är prioritet 1.
*   **Liturgisk "Tvang":** RAG-systemet är ibland för aggressivt och tvingar in standardböner även vid små variationer.

---

## 4. Ändringslogg & Historik (Co-Designer Log)

### Fas 0: Infrastruktur
*   [x] Implementerat SpecEditor med "Persistent Reference" (IndexedDB).
*   [x] Brutit upp dokumentation i moduler (\`specs/*.ts\`).
*   [x] Skapat "Help"-modul för användarguide.
*   [x] Skapat "Welcome"-modul med instruktioner och länkar.

### Fas 1: UI & Dashboard
*   [x] Gått från "Wizard" (steg-för-steg) till "Single Page Dashboard".
*   [x] Implementerat "Living UI" (realtidsöversättning av gränssnittet).
*   [x] Skapat visuell feedback (Frekvensstaplar, Status-ljus).

### Fas 2: Ljud & AI
*   [x] Integrerat Gemini Live API (Native Audio).
*   [x] Implementerat VAD (Voice Activity Detection) för styrning.
*   [x] Implementerat "Group Mode" (Hardware AGC vs Software Boost).

### Fas 3: Integration (MeetingBridge)
*   [x] C++ Server (Gateway) kodad och dokumenterad.
*   [x] Host Admin UI implementerat i webben.
*   [x] Distributed Mutex (Talking Stick) logik.

---

*Detta dokument uppdateras automatiskt av AI:n vid designändringar.*
`;
