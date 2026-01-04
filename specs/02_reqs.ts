
export const REQS_MD = `# Kravspecifikation & Designregler

## 1. Systemregler
*   **Persistent Design:** Designval får inte raderas utan explicit order.
*   **Modularitet:** Vid kodändringar, ändra minsta möjliga mängd kod.
*   **Säkerhet:** Använd alltid IndexedDB för data som måste överleva en "Hard Reload".
*   **Dashboard-principen:** Appen är en "Single Page Application". All kritisk kontroll (Start/Stopp, Språk, Mode) ska finnas på en skärm. Inga "Wizards" eller flerstegs-processer för att starta.

## 2. Användarupplevelse (UX)
*   **Målgrupp:** Icke-tekniska volontärer i kyrkan.
*   **Feedback:** Användaren måste *alltid* se om systemet lyssnar (Visuella staplar) och om det sänder (Status-text).
*   **Start/Stopp:** En stor, tydlig knapp (Högtalar-ikon) styr allt.
    *   **Live (Grön/Aktiv):** Mic öppen, AI ansluten.
    *   **Standby/Mute (Röd/Grå):** Mic stängd, AI pausad/frånkopplad.

## 3. Översättningslägen (Modes)
*   **Simultaneous (Talk immediately):**
    *   AI:n översätter löpande (buffrar och skickar i chunks).
    *   Latens är prio 1.
    *   **Krav:** Får inte tystna vid långa meningar. (Kritiskt problem just nu).
*   **Sequential (Take turns):**
    *   AI:n väntar på tystnad (VAD) innan den översätter.
    *   Hög precision är prio 1.

## 4. Kontext & RAG
*   **Syfte:** Ge AI:n korrekt terminologi (Liturgi).
*   **Regel:** Kontext-filer är *referensmaterial*. AI:n får **inte** tvinga in en text om talaren avviker från den. Den ska "stötta", inte "ersätta".

## 5. Hårdvara & Audio
*   **Group Mode:**
    *   *Small Group:* Mjukvaruförstärkning (Digital Gain) för svaga mikrofoner.
    *   *Large Group:* Hårdvaru-AGC (Auto Gain Control) för PA-system/Tesira.
*   **Gateway (Pro):**
    *   Stöd för WebSocket-koppling mot C++ backend (NDI/ASIO).
    *   Måste hantera nätverksavbrott snyggt (Auto-reconnect).

## 6. UI-Översättning
*   Hela gränssnittet ska översättas till valt målspråk.
*   Svenska och Engelska är hårdkodade för prestanda.
*   Övriga språk genereras via AI vid start.
`;
