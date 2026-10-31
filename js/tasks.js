// De bibliotheek met 100 taakjes.
// mode 'race'  = zo snel mogelijk, klaar vóór de slang op is.
// mode 'hold'  = volhouden: juist doorgaan tot de slang op is (tanden poetsen, handen wassen).
// sec          = standaard doeltijd in seconden; de ouder kan die per taak aanpassen.

export const CATEGORIES = [
  { id: 'eigen', name: 'Mijn eigen taken' },
  { id: 'aankleden', name: 'Aankleden' },
  { id: 'buiten', name: 'Naar buiten' },
  { id: 'thuis', name: 'Thuiskomen' },
  { id: 'badkamer', name: 'Badkamer' },
  { id: 'opruimen', name: 'Opruimen' },
  { id: 'eten', name: 'Eten & tafel' },
  { id: 'bedtijd', name: 'Bedtijd' },
  { id: 'helpen', name: 'Helpen in huis' },
  { id: 'bewegen', name: 'Bewegen' },
  { id: 'zoeken', name: 'Zoekspelletjes' },
];

const t = (id, cat, emoji, name, say, sec, mode = 'race') => ({ id, cat, emoji, name, say, sec, mode });

export const TASKS = [
  // Aankleden
  t('onderbroek-aan', 'aankleden', '🩲', 'Onderbroek aantrekken', 'Trek je onderbroek aan!', 30),
  t('hemdje-aan', 'aankleden', '🎽', 'Hemdje aantrekken', 'Trek je hemdje aan!', 30),
  t('shirt-aan', 'aankleden', '👕', 'Shirt aantrekken', 'Trek je shirt aan!', 45),
  t('broek-aan', 'aankleden', '👖', 'Broek aantrekken', 'Trek je broek aan!', 60),
  t('sokken-aan', 'aankleden', '🧦', 'Sokken aantrekken', 'Trek je sokken aan!', 60),
  t('trui-aan', 'aankleden', '🧶', 'Trui aantrekken', 'Trek je trui aan!', 60),
  t('jurk-aan', 'aankleden', '👗', 'Jurk of rok aantrekken', 'Trek je jurk of rok aan!', 45),
  t('korte-broek-aan', 'aankleden', '🩳', 'Korte broek aantrekken', 'Trek je korte broek aan!', 45),
  t('maillot-aan', 'aankleden', '🦵', 'Maillot aantrekken', 'Trek je maillot aan!', 90),
  t('knoopjes-dicht', 'aankleden', '🔘', 'Knoopjes dichtdoen', 'Doe je knoopjes dicht!', 60),
  t('zwemkleding-aan', 'aankleden', '🩱', 'Zwemkleding aantrekken', 'Trek je zwemkleding aan!', 60),
  t('helemaal-aankleden', 'aankleden', '🧒', 'Helemaal aankleden', 'Kleed je helemaal aan!', 300),

  // Naar buiten
  t('jas-aan', 'buiten', '🧥', 'Jas aantrekken', 'Trek je jas aan!', 45),
  t('schoenen-aan', 'buiten', '👟', 'Schoenen aantrekken', 'Trek je schoenen aan!', 60),
  t('laarzen-aan', 'buiten', '👢', 'Laarzen aantrekken', 'Trek je laarzen aan!', 45),
  t('muts-op', 'buiten', '🧢', 'Muts of pet opzetten', 'Zet je muts op!', 15),
  t('sjaal-om', 'buiten', '🧣', 'Sjaal omdoen', 'Doe je sjaal om!', 20),
  t('wanten-aan', 'buiten', '🧤', 'Wanten aandoen', 'Doe je wanten aan!', 60),
  t('regenjas-aan', 'buiten', '☔', 'Regenjas aantrekken', 'Trek je regenjas aan!', 60),
  t('tas-pakken', 'buiten', '🎒', 'Tas pakken', 'Pak je tas!', 30),
  t('fietshelm-op', 'buiten', '🚲', 'Fietshelm opzetten', 'Zet je fietshelm op!', 30),
  t('alles-aan-buiten', 'buiten', '🚪', 'Alles aan voor buiten', 'Trek alles aan, we gaan naar buiten!', 180),

  // Thuiskomen
  t('jas-ophangen', 'thuis', '🧥', 'Jas ophangen', 'Hang je jas op!', 30),
  t('schoenen-wegzetten', 'thuis', '👟', 'Schoenen uit en wegzetten', 'Zet je schoenen netjes weg!', 30),
  t('tas-uitpakken', 'thuis', '🎒', 'Tas uitpakken', 'Pak je tas uit!', 45),
  t('broodtrommel', 'thuis', '🥪', 'Broodtrommel naar de keuken', 'Breng je broodtrommel naar de keuken!', 20),
  t('sokken-uit', 'thuis', '🧦', 'Sokken uittrekken', 'Trek je sokken uit!', 20),
  t('uitkleden', 'thuis', '🛁', 'Helemaal uitkleden', 'Kleed je helemaal uit!', 90),
  t('wasmand', 'thuis', '🧺', 'Vuile kleren in de wasmand', 'Gooi je vuile kleren in de wasmand!', 30),
  t('sloffen-aan', 'thuis', '🥿', 'Sloffen aandoen', 'Doe je sloffen aan!', 20),

  // Badkamer
  t('tanden-poetsen', 'badkamer', '🦷', 'Tanden poetsen', 'Poets je tanden!', 120, 'hold'),
  t('handen-wassen', 'badkamer', '🧼', 'Handen wassen', 'Was je handen met zeep!', 20, 'hold'),
  t('gezicht-wassen', 'badkamer', '💦', 'Gezicht wassen', 'Was je gezicht!', 30),
  t('haren-borstelen', 'badkamer', '💇', 'Haren borstelen', 'Borstel je haren!', 30, 'hold'),
  t('neus-snuiten', 'badkamer', '🤧', 'Neus snuiten', 'Snuit je neus en gooi het zakdoekje weg!', 20),
  t('plassen', 'badkamer', '🚽', 'Plassen en doortrekken', 'Ga plassen en trek door!', 90),
  t('afdrogen', 'badkamer', '🧖', 'Afdrogen na het badje', 'Droog je helemaal af!', 60),
  t('badspeelgoed', 'badkamer', '🦆', 'Badspeelgoed opruimen', 'Ruim je badspeelgoed op!', 45),
  t('insmeren', 'badkamer', '🧴', 'Insmeren met zonnebrand', 'Smeer je in met zonnebrand!', 60),
  t('nagels-knippen', 'badkamer', '✂️', 'Stilzitten bij nagels knippen', 'Zit heel stil, dan knippen we je nagels!', 60, 'hold'),

  // Opruimen
  t('speelgoed-opruimen', 'opruimen', '🧸', 'Speelgoed opruimen', 'Ruim je speelgoed op!', 120),
  t('blokken', 'opruimen', '🧱', 'Blokken in de bak', 'Doe alle blokken in de bak!', 90),
  t('knuffels-op-bed', 'opruimen', '🐻', 'Knuffels op bed zetten', 'Zet je knuffels op bed!', 45),
  t('boeken', 'opruimen', '📚', 'Boeken in de kast', 'Zet de boeken in de kast!', 60),
  t('puzzel', 'opruimen', '🧩', 'Puzzel in de doos', 'Doe de puzzel in de doos!', 60),
  t('autootjes', 'opruimen', '🚗', 'Autootjes opruimen', 'Ruim je autootjes op!', 60),
  t('treinbaan', 'opruimen', '🚂', 'Treinbaan opruimen', 'Ruim de treinbaan op!', 120),
  t('kleurpotloden', 'opruimen', '🖍️', 'Kleurpotloden opruimen', 'Doe de kleurpotloden in de bak!', 45),
  t('knutselspullen', 'opruimen', '🎨', 'Knutselspullen opruimen', 'Ruim je knutselspullen op!', 90),
  t('verkleedkleren', 'opruimen', '👑', 'Verkleedkleren opruimen', 'Ruim de verkleedkleren op!', 60),
  t('ballen', 'opruimen', '⚽', 'Ballen verzamelen', 'Verzamel alle ballen!', 45),
  t('hele-kamer', 'opruimen', '🏠', 'Hele kamer opruimen', 'Ruim je hele kamer op!', 300),

  // Eten & tafel (bewust geen 'snel eten'-taken)
  t('aan-tafel', 'eten', '🪑', 'Aan tafel komen zitten', 'Kom aan tafel zitten!', 20),
  t('tafel-dekken', 'eten', '🍴', 'Tafel dekken', 'Help de tafel dekken!', 120),
  t('bekers', 'eten', '🥤', 'Bekers op tafel zetten', 'Zet de bekers op tafel!', 30),
  t('brood', 'eten', '🍞', 'Brood op tafel zetten', 'Zet het brood op tafel!', 30),
  t('bord-wegbrengen', 'eten', '🥣', 'Je bord naar de keuken', 'Breng je bord naar de keuken!', 20),
  t('tafel-afruimen', 'eten', '🍽️', 'Tafel afruimen', 'Help de tafel afruimen!', 90),
  t('tafel-afnemen', 'eten', '🧽', 'Tafel afnemen', 'Neem de tafel af met een doekje!', 45),
  t('vaatwasser', 'eten', '🥄', 'Lepels uit de vaatwasser', 'Haal de lepels en vorken uit de vaatwasser!', 60),
  t('fruit-pakken', 'eten', '🍎', 'Fruit pakken', 'Pak een stuk fruit!', 30),

  // Bedtijd
  t('pyjama-aan', 'bedtijd', '🌙', 'Pyjama aantrekken', 'Trek je pyjama aan!', 120),
  t('kleren-morgen', 'bedtijd', '👚', 'Kleren voor morgen neerleggen', 'Leg je kleren voor morgen neer!', 90),
  t('boekje-kiezen', 'bedtijd', '📖', 'Boekje kiezen', 'Kies een boekje!', 30),
  t('knuffel-pakken', 'bedtijd', '🐰', 'Knuffel voor in bed', 'Pak je knuffel voor in bed!', 15),
  t('nachtlampje', 'bedtijd', '💡', 'Nachtlampje aandoen', 'Doe je nachtlampje aan!', 15),
  t('gordijnen', 'bedtijd', '🌃', 'Gordijnen dichtdoen', 'Doe de gordijnen dicht!', 20),
  t('nachtkus', 'bedtijd', '😘', 'Iedereen een nachtkus geven', 'Geef iedereen een nachtkus!', 60),
  t('in-bed', 'bedtijd', '🛌', 'In bed kruipen', 'Kruip lekker in bed!', 20),
  t('slapende-beer', 'bedtijd', '😴', 'Stil liggen als een beer', 'Lig heel stil, als een slapende beer!', 60, 'hold'),

  // Helpen in huis
  t('bed-opmaken', 'helpen', '🛏️', 'Bed opmaken', 'Maak je bed op!', 90),
  t('sokken-sorteren', 'helpen', '🧦', 'Sokken sorteren', 'Zoek de sokken die bij elkaar horen!', 120),
  t('wasmachine', 'helpen', '🌀', 'Was in de wasmachine', 'Stop de was in de wasmachine!', 60),
  t('planten', 'helpen', '🌱', 'Plantjes water geven', 'Geef de plantjes water!', 60),
  t('huisdier', 'helpen', '🐱', 'Huisdier eten geven', 'Geef het huisdier eten!', 30),
  t('afval', 'helpen', '🗑️', 'Afval in de prullenbak', 'Gooi het afval in de prullenbak!', 20),
  t('afval-scheiden', 'helpen', '♻️', 'Afval scheiden', 'Doe het papier en plastic in de goede bak!', 60),
  t('kruimels', 'helpen', '🧹', 'Kruimels opvegen', 'Veeg de kruimels op!', 60),
  t('kussens', 'helpen', '🛋️', 'Kussens op de bank', 'Leg de kussens netjes op de bank!', 30),
  t('boodschappen', 'helpen', '🛒', 'Boodschappen uitpakken', 'Help de boodschappen uitpakken!', 120),

  // Bewegen
  t('kangoeroe', 'bewegen', '🦘', 'Springen als een kangoeroe', 'Spring tien keer als een kangoeroe!', 20),
  t('kikker', 'bewegen', '🐸', 'Kikkersprongen', 'Maak vijf kikkersprongen!', 20),
  t('flamingo', 'bewegen', '🦩', 'Op één been staan', 'Sta op één been, als een flamingo!', 15, 'hold'),
  t('standbeeld', 'bewegen', '🗿', 'Stilstaan als een standbeeld', 'Sta heel stil, als een standbeeld!', 20, 'hold'),
  t('klappen', 'bewegen', '👏', 'Tien keer klappen', 'Klap tien keer in je handen!', 15),
  t('sterrensprong', 'bewegen', '⭐', 'Sterrensprongen', 'Maak vijf sterrensprongen!', 20),
  t('poes', 'bewegen', '🐈', 'Kruipen als een poes', 'Kruip als een poes naar de bank en terug!', 30),
  t('tenen', 'bewegen', '🦶', 'Tenen aanraken', 'Raak tien keer je tenen aan!', 30),
  t('dansen', 'bewegen', '💃', 'Dansen', 'Dans maar lekker!', 30, 'hold'),
  t('ballon', 'bewegen', '🎈', 'Ademen als een ballon', 'Adem rustig in en uit, als een ballon!', 30, 'hold'),

  // Zoekspelletjes
  t('zoek-rood', 'zoeken', '🔴', 'Zoek iets roods', 'Zoek iets wat rood is en breng het hier!', 30),
  t('zoek-geel', 'zoeken', '🟡', 'Zoek iets geels', 'Zoek iets wat geel is en breng het hier!', 30),
  t('zoek-blauw', 'zoeken', '🔵', 'Zoek iets blauws', 'Zoek iets wat blauw is en breng het hier!', 30),
  t('zoek-groen', 'zoeken', '🟢', 'Zoek iets groens', 'Zoek iets wat groen is en breng het hier!', 30),
  t('zoek-rond', 'zoeken', '⚪', 'Zoek iets ronds', 'Zoek iets wat rond is!', 30),
  t('zoek-zacht', 'zoeken', '☁️', 'Zoek iets zachts', 'Zoek iets wat heel zacht is!', 30),
  t('zoek-knuffels', 'zoeken', '🐼', 'Zoek drie knuffels', 'Zoek drie knuffels en breng ze hier!', 45),
  t('zoek-schoenen', 'zoeken', '👞', 'Zoek je schoenen', 'Zoek je schoenen!', 30),
  t('zoek-boek', 'zoeken', '📕', 'Zoek een boek', 'Zoek een boek en breng het hier!', 30),
  t('zoek-geluid', 'zoeken', '🔔', 'Zoek iets wat geluid maakt', 'Zoek iets wat geluid maakt!', 30),
];

// Wat er bij de eerste keer openen op het startscherm staat.
export const DEFAULT_ENABLED = [
  'broek-aan', 'shirt-aan', 'sokken-aan', 'schoenen-aan', 'jas-aan', 'helemaal-aankleden',
  'tanden-poetsen', 'handen-wassen', 'speelgoed-opruimen', 'pyjama-aan', 'in-bed', 'zoek-rood',
];

// Emoji die een ouder kan kiezen voor een eigen taak (als er geen foto is).
export const CUSTOM_EMOJI = [
  '⭐', '🧸', '🚗', '🧩', '📚', '🧦', '👟', '🧥', '🎒', '🍎', '🍽️', '🛏️',
  '🦷', '🧼', '🚽', '🐶', '🐱', '🌱', '🧹', '🗑️', '🎨', '⚽', '🏀', '🎵',
  '🖍️', '📦', '🧺', '🛁', '🚲', '🛴', '🚪', '🔑', '🍌', '🥛', '🐻', '🐰',
  '🦖', '🚀', '❤️', '🎈', '🎁', '🌈', '☀️', '🌙', '🐟', '🦆', '🚒', '🏰',
];
