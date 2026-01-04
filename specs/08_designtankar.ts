

export const DESIGNTANKAR_MD = `# Strategi & Arkitektur

Detta dokument definierar *hur* vi bygger systemet. (Historik och dialog ligger numera i \`10_process_log.md\`).

## 1. Den Autonoma Design-Strategin
Vi har identifierat en svaghet i hur AI-assistenter arbetar: **Impulsivitet**.
När en fil genereras om, tenderar historik och nyanser att skrivas över.

### Lösningen: "Separation of Concerns" via Filer
För att motverka minnesförlust delar vi upp informationen i fler, mindre filer.
1.  **Fakta:** \`01_plan\`, \`02_reqs\` (Detta ändras sällan).
2.  **Aktion:** \`03_todo\` (Detta ändras ofta).
3.  **Reflektion:** \`08_designtankar\` (Detta dokument - långsiktig strategi).
4.  **Process:** \`10_process_log\` (Vår dialog och iterationer).

### Regelverk för AI:n
*   **Aldrig radera utan att flytta:** Om information tas bort från en fil, måste den antingen vara obsolet eller flyttas till en mer passande fil.
*   **Skapa nytt vid behov:** Var inte rädd för att skapa nya filer om ett ämne växer sig för stort.

---

## 2. Infrastruktur (Teknisk Fakta)

### API:er
*   **Gemini Live:** \`gemini-2.5-flash-native-audio-preview-09-2025\` (Realtid).
*   **Gemini Flash:** \`gemini-2.5-flash\` (UI-text).
*   **Signaling:** PeerJS Cloud.

### Namngivning & Konsistens
Vi strävar efter att koden ska spegla verkligheten ("Map matches Territory").
*   **Mapp:** \`specs/\`
*   **UI-Label:** "Specs" (Tidigare "Project Specs").
*   **Editor:** \`SpecEditor.tsx\` (Matchar mappen).

---

## 3. Deployment & Kostnad
*   **Hosting:** Statisk export.
*   **Drift:** API-nyckel krävs. Free Tier fungerar för test, Paid Tier för produktion.
`;