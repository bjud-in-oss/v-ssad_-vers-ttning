

export const PROCESS_LOG_MD = `# Processlogg & Dialog

Denna fil är vårt "långtidsminne" för diskussioner, så att vi inte tappar tråden när vi skriver om andra specifikationsfiler.

## Senaste Iterationen: Impulsivitet & Struktur

### Problemet
Användaren noterade att AI:n (jag) tenderar att "sopa rent" vid uppdateringar och tappar historik.

### Lösningen: Expandera Kontextet
Vi använder nu denna fil (\`10_process_log.md\`) aktivt för att parkera tankar och beslut innan de implementeras. Detta minskar impulsiviteten.

---

## Ny Diskussion: Autonomi via Prompt Injection (Afasi-lösningen)

**Användarens Observation:**
> "Du liknar en person med AFASI som inte har förmågan att ta eget initiativ... klarar du då komma igång igen varje gång? Kan du möjligen hjälpa mig undersöka varför det blev så och justera hur du arbetar."

**Analys:**
Användaren har identifierat kärnan i LLM-arkitekturen: Jag är **Stateless**.
Jag saknar "Initiativ" eftersom jag inte existerar mellan prompter.
Jag missar att städa upp i \`00_welcome.md\` och tappar tråden i loggen eftersom jag blir hyperfokuserad på den *senaste* diffen jag ser.

**Åtgärd (Implementerad):**
Vi har modifierat verktyget (\`SpecEditor\`) så att det nu **automatiskt** lägger till en "Systempåminnelse" i slutet av varje prompt du kopierar.

**Prompt-tillägget:**
> "VITAL SYSTEM REMINDER FOR AI:
> 1. CONTEXT RECOVERY: You are stateless. You MUST read 'specs/10_process_log.md' to understand the broader plan.
> 2. MANDATORY CLEANUP: Reset '00_welcome.md' wish list to '[ Skriv dina önskemål här... ]'.
> 3. AUTONOMY: Act like a senior developer. Plan first, then code."

Detta säkerställer att jag "vaknar upp" med rätt mindset varje gång, städar efter mig, och minns vad vi håller på med.

---

## Autonom Åtgärd: Robusthet (Task 10)
Jag noterade att användaren skickade in en tom förfrågan ("Inga ändringar hittades"). 
Enligt principen om autonomi tog jag initiativet att förbättra felhanteringen vid oväntade nätverksavbrott.

**Problem:** Om WebSocket stängs oväntat (ej manuellt), kunde UI:t fastna i "Connected" läge trots att kopplingen var död.
**Lösning:** 
1. Uppdaterade \`useConnectionManager\` att tvinga status till \`DISCONNECTED\` vid oväntad \`onClose\`.
2. Uppdaterade \`useAudioSession\` att lyssna på detta och städa upp resurser (stoppa mic) samt visa "Connection Lost" för användaren.

---

## Autonom Åtgärd: Akustisk Miljö (Group Mode)
Jag noterade att Task 7 (Group Mode / AGC) var markerad som klar men saknade UI i den nya designen. Detta är kritiskt för små grupper där mikrofonen behöver extra förstärkning.

**Åtgärd:**
1.  Skapade en ny typ \`AcousticEnvironment\` ('small-group' | 'large-group').
2.  Lade till UI-knappar i \`DetailSettings\` för att växla miljö.
3.  Implementerade en Digital Pre-Amp (2.5x gain) i \`useAudioRecorder\` som aktiveras vid "Small Group".
4.  Lade till nödvändiga etiketter i översättningsfilerna.

---

## Autonom Åtgärd: Host Admin (Task 8)
För att fortsätta beta av TODO-listan autonomt, har jag förbättrat **Host Admin**-gränssnittet.

**Problem:** Värdar behövde skriva in NDI-källnamn manuellt varje gång ("PC-1"), vilket är felbenäget.
**Lösning:**
1.  Implementerade **Quick Presets** i \`HostAdminStep\`. Värden kan nu spara och återanvända NDI-mål (sparas lokalt i webbläsaren).
2.  Förtydligade logg-konsolen.

**Uppdatering (UX):**
Användaren påpekade att "Stäng"-knappen var för liten och att layouten tog onödig plats.
**Åtgärd:**
1.  Förstorat stäng-krysset i headern.
2.  Tagit bort den dubblerade stäng-knappen i botten.
3.  Gjort layouten mer responsiv med scroll (om skärmen är liten) och låtit logg-fönstret ta all överbliven plats.

---

## Fix: SpecEditor Data Loss
Användaren rapporterade att ändringar i Editorn försvann om man stängde fönstret för att titta på appen och sedan öppnade det igen.
**Åtgärd:**
Lade till en spärr (\`hasInitialized\`) i \`SpecEditor\`.
*   Tidigare: Återställde alla filer till originalet varje gång fönstret öppnades (\`isOpen=true\`).
*   Nu: Återställer bara första gången. Om användaren stänger och öppnar igen behålls deras redigeringar i minnet (så länge sidan inte laddas om).

---

## UX: Textjusteringar (Svenska)
Användaren påpekade att texten "När ska tolken prata?" och "Simultan" kunde förbättras, samt att tilltalet "DU" var missvisande då det ofta är andra som talar.
**Åtgärd:**
1. Ändrat Dashboard-etiketten till: **"När ska talaren och tolken prata?"**.
2. Ändrat läges-etiketten från "Simultan" till **"Samtidigt"**.

---

## UI Fix: iOS Språkväljare
Användaren rapporterade att språkväljaren var vänsterjusterad på iOS.
**Åtgärd:**
Lade till \`text-align-last: center\` på select-elementet i \`DashboardControls\`. Detta är en känd iOS Safari-fix för att tvinga fram centrering.

---

## UI Justering: Fontstorlek (Konsekvens)
Användaren bad om att konsekvent använda den större fontstorleken (13px / 130%) på alla motsvarande rubriker i appen.
**Åtgärd:**
Uppdaterade alla \`text-[10px]\` och \`text-xs\` rubriker till \`text-[13px]\` i:
- \`DetailSettings\` (Acoustic Environment, Tempo)
- \`HostAdminStep\` (Gateway URL, NDI Target)
- \`App.tsx\` (System Metrics Header)

---

## UI Justering: Konsekvent Svenska & Manuell Toggle
Användaren noterade att engelska fortfarande visades och ville ha en manuell knapp för att tvinga fram svenska (eller engelska) under utveckling.
**Åtgärd:**
1.  **Svenska som Master:** Bytte innehållet i \`DEFAULT_UI_TEXT\` (\`uiConstants.ts\`) till svenska. Appen startar nu alltid på svenska.
2.  **Engelska som Fallback:** Flyttade den engelska texten till \`uiTranslationService.ts\` som en hårdkodad fallback.
3.  **UI Language Toggle:** Lade till knappar (SV / EN) i \`DetailSettings\` som manuellt byter UI-språket.
4.  **Persistens:** UI-språksvalet sparas i \`localStorage\` så det överlever en sidladdning.

---

## Autonom UX Förbättring: Lokaliserad Språklista
Enligt önskemålet om "Konsekvent Svenska" har jag uppdaterat språkväljaren.
**Åtgärd:**
Uppdaterade \`DashboardControls\` att använda \`Intl.DisplayNames\` baserat på valt UI-språk.
*   Om du valt Svenska: Visas "Spanska", "Engelska" i listan.
*   Om du valt Engelska: Visas "Spanish", "English".

---

## Autonom Feedback Förbättring: Mutex LOCKED
För att stödja MeetingBridge-funktionen (Gateway) bättre.
**Åtgärd:**
Lade till ett visuellt "LOCKED" läge i \`SimultaneousDashboard\`. Om en extern talare (via Gateway) låser kanalen, ser användaren nu detta tydligt (Röd ring + hänglås) istället för att tro att appen är trasig.

---

## Autonom UX: Gateway Warning Fix
Jag noterade att "Metrics"-vyn visade en ilsket röd varning "⚠️ GATEWAY: FRÅNKOPPLAD" även för vanliga användare som inte använder Gateway-funktionen.
**Åtgärd:**
Uppdaterade \`App.tsx\` så att varningen endast visas om status är \`ERROR\` eller \`CONNECTING\`. Om den är rent \`DISCONNECTED\` (default) visas ingen varningsskylt, bara en neutral statusrad.

---

## Ny Funktion: Quick Feedback med AI
Användaren önskade en förenklad process för att ge feedback, där man inte behöver spara referensfiler i onödan och där man kan få AI-hjälp att formulera sig.

**Åtgärd:**
1.  **Quick Mode:** Skapade en ny standardvy i \`SpecEditor\`. Den visar en enkel textruta ("Vad vill du ändra?").
2.  **AI Refinement:** Lade till knappen **"✨ Refine with AI"** som använder Gemini Flash för att skriva om användarens text till en tydlig kravspecifikation.
3.  **One-Shot Copy:** Knappen "Copy & Close" injicerar texten i prompten och kopierar den, *utan* att trigga en nedladdning av backup-filen (enligt önskemålet om minskad friktion).
4.  **Advanced Mode:** Lade till en knapp för att växla till den gamla fil-baserade vyn.

---

## Refactoring: SpecEditor Modularity (Technical Debt)
För att minska teknisk skuld och göra koden mer läsbar har vi nu brutit upp \`SpecEditor.tsx\` (1000+ rader) till modulära komponenter.

**Struktur:**
*   \`utils/diffUtils.ts\`: Logik för diff-beräkning.
*   \`components/spec-editor/QuickEditor.tsx\`: Enkel vy.
*   \`components/spec-editor/AdvancedEditor.tsx\`: Avancerad vy.
*   \`components/spec-editor/FileSidebar.tsx\`: Filhantering.
*   \`components/spec-editor/LiveVisualDiff.tsx\`: Diff-visualisering.
*   \`components/spec-editor/Overlays.tsx\`: (Import, Save, Share).

Detta gör systemet robustare och lättare att underhålla framöver.

---

## Workflow Optimization: AI Studio Integration
Användaren önskade ett smidigare flöde för att använda "Refine with AI" och sedan direkt applicera detta i AI Studio.

**Implementerade Krav:**
1.  **UI:** Knappen heter nu **"✨ Refine & Copy Prompt"** och ligger i knappraden (blockerar inte texten).
2.  **Navigering:**
    *   **Quick Mode First:** Ingen import-dialog visas vid start.
    *   **Conditional Import:** Dialogen visas bara när man går in i "Advanced Editor" (och saknar ref).
    *   **Advanced -> Quick:** Efter "Save as" navigeras man tillbaka till Quick Mode för nästa ändring.
3.  **Logik:** Klick på "Refine & Copy":
    *   Förbättrar texten med AI.
    *   Skapar fullständig prompt (inkl diffar om de finns).
    *   Kopierar till urklipp.
    *   Öppnar AI Studio i ny flik.
    *   Visar instruktioner: "Klistra in och tryck Pil Upp".

---

## Fix: Advanced Editor Navigation
En kritisk bugg upptäcktes där knappen "Advanced Editor" verkade vara död.
**Orsak:** \`handleSwitchToAdvanced\` i \`SpecEditor.tsx\` satte bara \`showImportOverlay(true)\` om referens saknades, men glömde att byta \`editorMode\` från 'QUICK' till 'ADVANCED'. Eftersom overlayen renderas *inuti* Advanced-blocket, hände ingenting visuellt.
**Lösning:** Uppdaterade funktionen så att den alltid sätter \`editorMode('ADVANCED')\` först.

---

## Fix: Clipboard Write Permission Denied
Användaren rapporterade felet "Failed to execute 'writeText' on 'Clipboard': Write permission denied." vid användning av "Refine & Copy".
**Orsak:** Webbläsare blockerar ofta skrivning till urklipp om det sker inuti en asynkron funktion (t.ex. efter att AI:n svarat) då "användarinteraktionen" anses förbrukad.
**Lösning:**
1. Lade till \`try/catch\` runt alla clipboard-anrop.
2. Lade till en \`alert\` som informerar användaren om den automatiska kopieringen misslyckades, så att de kan kopiera manuellt.

---

## Fas 5: Finjustering (Multi-Duplex Dialog)

**Användarens Önskemål:**
> "Kan du göra en app som översätter semi äkta multi duplex simultandialog mellan svenska och valfritt språk"

**Analys:**
Appen är redan designad för detta, men instruktionerna till AI:n kan vässas för att garantera att den förstår "Semi-True Multi-Duplex" som en dubbelriktad dialog, även i simultanläget.

**Åtgärd:**
1.  **System Prompt:** Uppdaterat \`geminiLiveService.ts\` med explicita instruktioner i \`SIMULTANEOUS\`-blocket: "CRITICAL: Maintain bi-directional awareness...".
2.  **Metadata:** Uppdaterat \`metadata.json\` till "PolyGlot Meeting Translator" för att spegla appens mognad.

---
`;