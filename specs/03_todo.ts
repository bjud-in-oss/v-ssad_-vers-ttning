

export const TODO_MD = `======================================================================
AI ATT-GÖRA LISTA (PROJECT TRACKER)
======================================================================

FAS 0: CLEANUP & STRUKTUR (PÅGÅENDE)
[A] 1. Rensa bort gammal "Wizard"-kod (LanguageSelectionStep, etc). (Klar: Filer tömda/borttagna).
[A] 2. Strukturera om dokumentationen. (Klar: Ny struktur i 01_plan och design_specs).
[ ] 3. Flytta över "designtankar" till en arkiverad sektion eller integrera i Plan.

FAS 1: KRITISKA FIXAR (PRIORITET 1)
[x] 4. **SIMULTAN ÖVERSÄTTNING AVBROTT:** 
    - Problem: Vid långa meningar i simultanläge slutar AI:n ibland att sända ljud, eller klipper mitt i. 
    - Analys: Kan bero på VAD-logik som klipper för tidigt, eller "maxOutputTokens" i Gemini.
    - Åtgärd: Implementerat robustare ljudspelare (useAudioPlayer) som tvingar omstart vid tystnad, samt bättre Connection-status (CONNECTING) för att förhindra race conditions. (Klar).
[x] 5. **RAG "Tvång":** Fixa så att AI:n inte tvingar in sakramentsböner om talaren säger något annat. (Klar: Uppdaterad systeminstruktion).

FAS 2: FUNKTIONALITET
[x] 6. Implementera "Single Page Dashboard". (Klar).
[x] 7. Implementera "Group Mode" (AGC). (Klar: Digital Pre-Amp + UI controls in DetailSettings).
[x] 8. Förbättra "Host Admin" med status för anslutna klienter (om Gateway används). (Klar: Implementerat Quick Presets och förbättrad loggning).

FAS 3: ROBUSTHET
[x] 9. Implementera "GoAway" hantering från Gemini API (för långa sessioner >15min). (Klar: Automatisk klient-rotation var 12:e minut).
[x] 10. Bättre felhantering vid nätverksbyte (WiFi -> 4G). (Klar: Oväntade avbrott hanteras av useConnectionManager).

FAS 4: REFACTORING & MODULARITY
[x] 11. Bryt ut \`AudioQueueManager\` (uppspelning) till en egen hook/klass. (Klar: useAudioPlayer).
[x] 12. Bryt ut \`ConnectionManager\` (WebSocket/Gemini) till en egen tjänst. (Klar: useConnectionManager).
[x] 13. Förenkla \`useAudioSession\` till att endast vara dirigent. (Klar: useAudioRecorder).
[x] 14. Modularisera \`App.tsx\` (UI-komponenter). (Klar: DashboardControls, DetailSettings, LiveControls).

======================================================================
`;