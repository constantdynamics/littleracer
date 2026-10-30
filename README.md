# Little Racer

**Ben jij sneller dan de slang?** Little Racer is een vrolijke taakjes-timer voor kleuters (vanaf ongeveer 4 jaar). Je kind trekt bijvoorbeeld de broek aan, ruimt speelgoed op of zoekt iets roods, terwijl een slang, slak of trein laat zien hoeveel tijd er nog is. Is je kind klaar terwijl er nog slang over is? Dan was het sneller dan de slang en krijgt het een sticker.

De app is een web-app voor Android-tablets en -telefoons (Chrome). Je kunt hem op het startscherm zetten, dan werkt hij als een gewone app, ook zonder internet.

## Zo werkt het

1. **Taakje kiezen.** Op het startscherm staan grote plaatjes van de taakjes die jij hebt klaargezet. Jij tikt er één aan.
2. **Racer kiezen.** Je kind kiest wie er meedoet: de 🐍 slang, de 🐌 slak of de 🚂 trein. De app zegt de taak hardop ("Trek je broek aan! Ben je sneller dan de slang?").
3. **Aftellen.** Zeg hardop *"Op je plaatsen… klaar… af!"*. Het startlicht springt mee van rood naar oranje naar groen, en bij *"af"* begint de race. Je kunt ook op de lampen tikken: dan telt de app zelf af.
4. **Racen.** De figuur is precies zo lang als de doeltijd en verdwijnt van achteren:
   - de **slang** wordt van boven naar beneden steeds korter;
   - de **slak** kruipt in een slakkenhuis-spiraal naar de aardbei in het midden en eet onderweg de bolletjes op;
   - bij de **trein** rijden de wagonnetjes één voor één weg.

   De stippeltjes laten zien hoeveel tijd er al voorbij is.
5. **Klaar!** Je kind drukt op de grote KLAAR-knop of roept *"Klaar!"*. Was het op tijd, dan check jij of alles echt goed is gedaan: **houd 👍 vast** om goed te keuren, of tik op **Nog even** als bijvoorbeeld een sok nog niet aan zit (de tijd loopt dan gewoon door).
6. **Feest.** Confetti, de slang (of slak of trein) doet een dansje, de app zegt hoeveel bolletjes er over waren ("Je had nog 5 bolletjes over!") en er komt een sticker in het stickerboek. Was het de snelste tijd ooit, dan krijgt de sticker een gouden rand met kroontje.

**Te laat?** Dan groeit er rustig een paars vriendje bij en moedigt de app aan ("Jij kan het! Nog even!"). Er is nooit een "verloren"-geluid. Aan het eind zegt de app gewoon "Goed gedaan!".

**Volhoud-taakjes.** Bij tanden poetsen, handen wassen of stilstaan als een standbeeld is sneller niet beter. Daar moet je kind juist doorgaan tot de figuur op is. Daarna komt er vanzelf een sticker.

## Ouder-modus

Houd het tandwiel ⚙️ rechtsboven **3 tellen vast** en los het rekensommetje op. Zo komt je kind er niet per ongeluk in.

- **Taken**: kies uit 100 taakjes welke op het startscherm staan, en stel per taakje de doeltijd in (de lengte van de slang). Zoeken en filteren per groep kan ook.
- **Eigen taken**: maak een eigen taakje met een foto (bijvoorbeeld van je eigen speelgoedbak) of een plaatje, met een eigen zin die de app voorleest.
- **Records**: per taakje de snelste tijd, hoe vaak het gespeeld en gehaald is, en de laatste vijf keren. Met **Record als doeltijd** maak je de slang precies zo lang als het record. Tijden en het stickerboek kun je wissen.
- **Geluid & stem**: geluidjes, voorlezen, keuze van de Nederlandse stem en spreeksnelheid, starten en stoppen met je stem, en een microfoontest die laat zien wat de app verstaat.
- **Algemeen**: naam van je kind (voor complimentjes zoals "Super, Noor!"), moeilijkheid (makkelijk +50% tijd, normaal, pittig −20%), licht of donker thema, en de app op het startscherm zetten.

## De 100 taakjes

| Groep | Aantal | Voorbeelden |
| --- | --- | --- |
| Aankleden | 12 | onderbroek, shirt, broek, sokken, trui, maillot, knoopjes, helemaal aankleden |
| Naar buiten | 10 | jas, schoenen, laarzen, muts, sjaal, wanten, fietshelm |
| Thuiskomen | 8 | jas ophangen, schoenen wegzetten, tas uitpakken, sloffen aan |
| Badkamer | 10 | tanden poetsen (volhouden), handen wassen (volhouden), neus snuiten, plassen |
| Opruimen | 12 | speelgoed, blokken, boeken, puzzel, treinbaan, hele kamer |
| Eten & tafel | 9 | aan tafel komen, tafel dekken, bord wegbrengen, tafel afnemen |
| Bedtijd | 9 | pyjama, boekje kiezen, nachtkus, in bed kruipen, stil liggen als een beer |
| Helpen in huis | 10 | bed opmaken, sokken sorteren, plantjes water geven, afval scheiden |
| Bewegen | 10 | kangoeroesprongen, flamingo (volhouden), standbeeld (volhouden), dansen |
| Zoekspelletjes | 10 | zoek iets roods, geels, blauws, zachts, iets wat geluid maakt |

Er zitten bewust geen "snel eten"-taakjes in. De volledige lijst staat in [`js/tasks.js`](js/tasks.js).

## Online zetten met GitHub Pages

De app is een map met gewone bestanden en draait gratis op GitHub Pages:

1. Merge de pull request naar `main`.
2. Ga op GitHub naar **Settings → Pages**.
3. Kies onder *Build and deployment* bij *Source* voor **Deploy from a branch**, kies branch **main** en map **/ (root)**, en klik **Save**.
4. Na een paar minuten staat de app op **<https://constantdynamics.github.io/littleracer/>**.

Elke nieuwe merge naar `main` zet GitHub vanzelf online. Verander je bestanden, verhoog dan ook `VERSION` in `sw.js`, zodat geïnstalleerde apps de nieuwe versie ophalen.

## Op je Android-tablet zetten

1. Open <https://constantdynamics.github.io/littleracer/> in **Chrome**.
2. Open het menu (⋮) en kies **App installeren** of **Toevoegen aan startscherm**. In de ouder-modus onder *Algemeen* staat ook een knop als Chrome dat aanbiedt.
3. Sta de **microfoon** toe als Chrome erom vraagt (nodig voor "klaar… af!" en "Klaar!").

Tips:

- Spraakherkenning werkt in Chrome en gebruikt de spraakdienst van Google, dus daarvoor is internet nodig. Tikken op de lampen en de KLAAR-knop werkt altijd, ook offline.
- Hoort de app geen Nederlandse stem? Installeer Nederlands bij *Instellingen → Systeem → Talen → Tekst-naar-spraak*.
- Hoor je steeds een piepje als de microfoon aangaat? Zet dan in de ouder-modus *Stoppen met je stem* uit.
- Tijdens een race blijft het scherm aan en werkt de terugknop niet, zodat je kind de race niet per ongeluk stopt. Wil je echt stoppen, houd dan ✖ ingedrukt.

## Privacy

Alles blijft op het apparaat: taakjes, tijden, records, stickers en foto's (localStorage en IndexedDB). Er is geen account en er gaat niets naar een server, behalve de spraak die Chrome naar de spraakherkenning van Google stuurt als je starten of stoppen met je stem aan hebt staan.

## Ontwikkelen

Geen build-stap en geen afhankelijkheden: gewone HTML, CSS en JavaScript-modules.

```bash
npm start
```

Dit start een lokale server op <http://localhost:8080>. Draai de tests met:

```bash
npm test
```

| Map of bestand | Inhoud |
| --- | --- |
| `index.html`, `manifest.webmanifest`, `sw.js` | app-omhulsel, installatie en offline-cache |
| `js/tasks.js` | de 100 taakjes |
| `js/logic.js` | doeltijden, records, stickers |
| `js/match.js` | herkennen van "op je plaatsen… klaar… af!" en "Klaar!" |
| `js/speech.js` | voorlezen en luisteren |
| `js/geometry.js`, `js/viz.js` | de zigzag- en spiraalbaan en het tekenen van slang, slak en trein |
| `js/views/` | de schermen: start, race, stickerboek, ouder-modus |
| `css/app.css` | vormgeving, licht en donker thema |
| `tests/` | tests voor de logica (`node --test`) |

Behalve op GitHub Pages werkt de app op elke statische host met https (zoals Netlify of Vercel): upload de map zoals hij is. Het lege bestand `.nojekyll` zorgt dat GitHub Pages de bestanden ongewijzigd doorgeeft.

## Licenties

De lettertypes [Fredoka](https://fonts.google.com/specimen/Fredoka) en [Nunito](https://fonts.google.com/specimen/Nunito) vallen onder de SIL Open Font License (zie `fonts/`). Plaatjes van taakjes en stickers zijn emoji van het apparaat zelf.
