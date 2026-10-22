import { RadioStation } from '../types/radio';

export const LONG_WAVE_STATIONS: RadioStation[] = [
  {
    id: 'bbc_radio_4',
    frequency: 198.0,
    callsign: 'BBC R4',
    name: 'BBC Radio 4 (Droitwich)',
    country: 'United Kingdom',
    location: 'Droitwich Transmitting Station, Worcestershire',
    powerKw: 500,
    category: 'broadcast',
    defaultMode: 'AM',
    defaultBandwidth: 9.0,
    activeStatus: 'Active',
    description: 'Iconic British longwave broadcast featuring the legendary Shipping Forecast, Today programme, Big Ben pips, and Test Match Special.',
    historicalNote: 'British Royal Navy Vanguard-class nuclear ballistic missile submarines maintain a continuous watch on 198 kHz. Under the "Letters of Last Resort", if BBC Radio 4 ceases broadcasting for consecutive days, commanders assess that the UK government has fallen.',
    coordinates: { lat: 52.296, lng: -2.106 },
    audioProfile: {
      type: 'speech',
      speechScript: [
        'And now the Shipping Forecast issued by the Met Office on behalf of the Maritime and Coastguard Agency.',
        'The general synopsis at midnight: Low south-west of Iceland, nine-seven-two, moving rapidly east-south-east.',
        'Viking, North Utsire, South Utsire: South-westerly four to six, veering westerly seven to severe gale nine later. Rain, then squally showers. Moderate or poor.',
        'Forties, Cromarty, Forth, Tyne: South-westerly five or six, increasing seven soon. Sea state rough or very rough.',
        'Dogger, Fisher, German Bight, Humber, Thames: Southerly four or five, increasing six. Slight or moderate. Good, occasionally poor.'
      ]
    }
  },
  {
    id: 'polskie_radio_1',
    frequency: 225.0,
    callsign: 'PR 1',
    name: 'Polskie Radio Program 1',
    country: 'Poland',
    location: 'Solec Kujawski Radio Transmitting Centre',
    powerKw: 1000,
    category: 'broadcast',
    defaultMode: 'AM',
    defaultBandwidth: 9.0,
    activeStatus: 'Active',
    description: 'The national Polish flagship public radio service broadcasting on high-power Long Wave across Central and Eastern Europe.',
    historicalNote: 'Uses two giant grounded guyed mast towers (330m and 289m) erected in 1999 following the collapse of the historic 646m Konstantynów radio mast (the tallest man-made structure in the world until 1991).',
    coordinates: { lat: 53.023, lng: 18.261 },
    audioProfile: {
      type: 'speech',
      speechScript: [
        'Tu Polskie Radio, program pierwszy. Nadajemy na falach długich, częstotliwość dwieście dwadzieścia pięć kiloherców ze stacji Solec Kujawski.',
        'Wiadomości z kraju i ze świata. W Warszawie temperatura osiem stopni Celsjusza, ciśnienie tysiąc dwanaście hektopaskali.'
      ]
    }
  },
  {
    id: 'dcf77',
    frequency: 77.5,
    callsign: 'DCF77',
    name: 'DCF77 Atomic Clock Standard',
    country: 'Germany',
    location: 'Mainflingen near Frankfurt am Main',
    powerKw: 50,
    category: 'time_signal',
    defaultMode: 'CW',
    defaultBandwidth: 0.5,
    activeStatus: 'Active',
    description: 'National and European legal time reference standard, controlled directly by primary cesium atomic clocks at PTB Braunschweig.',
    historicalNote: 'Transmits continuous carrier with minute-pulse amplitude modulation and phase modulation. Millions of railway clocks, wristwatches, utility grids, and traffic light systems synchronize to DCF77 daily.',
    coordinates: { lat: 50.015, lng: 9.008 },
    audioProfile: {
      type: 'time_ticks'
    }
  },
  {
    id: 'msf_time',
    frequency: 60.0,
    callsign: 'MSF',
    name: 'MSF 60 kHz Time Transmitter',
    country: 'United Kingdom',
    location: 'Anthorn Radio Station, Cumbria',
    powerKw: 17,
    category: 'time_signal',
    defaultMode: 'CW',
    defaultBandwidth: 0.5,
    activeStatus: 'Active',
    description: 'The UK National Time Standard operated by Babcock on behalf of the National Physical Laboratory (NPL).',
    historicalNote: 'Broadcasts precise pulses disciplined by three atomic clocks at the Anthorn transmitter hall, accurate to within 1 millisecond across the British Isles.',
    coordinates: { lat: 54.911, lng: -3.279 },
    audioProfile: {
      type: 'time_ticks'
    }
  },
  {
    id: 'wwvb_time',
    frequency: 60.0,
    callsign: 'WWVB',
    name: 'WWVB NIST Standard Time',
    country: 'United States',
    location: 'Fort Collins, Colorado',
    powerKw: 70,
    category: 'time_signal',
    defaultMode: 'CW',
    defaultBandwidth: 0.5,
    activeStatus: 'Active',
    description: 'US National Institute of Standards and Technology (NIST) low-frequency atomic time standard transmitter.',
    historicalNote: 'Covers the continental US, Canada, and Mexico. Synchronizes radio-controlled wall clocks, consumer weather stations, and industrial timing gear.',
    coordinates: { lat: 40.677, lng: -105.048 },
    audioProfile: {
      type: 'time_ticks'
    }
  },
  {
    id: 'saq_grimeton',
    frequency: 17.2,
    callsign: 'SAQ',
    name: 'Grimeton VLF Alternator',
    country: 'Sweden',
    location: 'Grimeton, Varberg Municipality, Halland',
    powerKw: 200,
    category: 'submarine_vlf',
    defaultMode: 'CW',
    defaultBandwidth: 0.5,
    activeStatus: 'Intermittent',
    description: 'UNESCO World Heritage electrical engineering marvel: the only operational Alexanderson high-frequency mechanical alternator in existence.',
    historicalNote: 'Built in 1924 by Ernst Alexanderson to transmit transatlantic radiotelegraphy directly to Long Island, NY. The 200 kW mechanical spinning dynamo rotor turns at 2,115 RPM to generate raw 17.2 kHz RF without vacuum tubes.',
    coordinates: { lat: 57.112, lng: 12.403 },
    audioProfile: {
      type: 'cw',
      morseText: 'CQ CQ CQ DE SAQ SAQ SAQ = THIS IS GRIMETON RADIO / SAQ IN SWEDEN = TRANSMISSION ON 17.2 KHZ USING ALEXANDERSON ALTERNATOR FROM 1924 = 73 DE SAQ'
    }
  },
  {
    id: 'dho38',
    frequency: 23.4,
    callsign: 'DHO38',
    name: 'DHO38 Naval Submarine VLF',
    country: 'Germany',
    location: 'Saterland-Ramsloh / Rhauderfehn, Lower Saxony',
    powerKw: 800,
    category: 'submarine_vlf',
    defaultMode: 'DATA',
    defaultBandwidth: 2.4,
    activeStatus: 'Active',
    description: 'High-power German Navy VLF submarine communication station with eight 352-meter guyed steel masts.',
    historicalNote: 'Very Low Frequency electromagnetic waves penetrate saline ocean water down to 20-30 meters, allowing submerged submarines to receive operational tasking orders without surfacing or deploying floating buoys.',
    coordinates: { lat: 53.082, lng: 7.616 },
    audioProfile: {
      type: 'fsk'
    }
  },
  {
    id: 'lincolnshire_poacher',
    frequency: 192.0,
    callsign: 'E03 / LP',
    name: 'The Lincolnshire Poacher (Ghost Station)',
    country: 'United Kingdom / Cyprus',
    location: 'RAF Akrotiri, Cyprus (Historical)',
    powerKw: 100,
    category: 'numbers_station',
    defaultMode: 'AM',
    defaultBandwidth: 6.0,
    activeStatus: 'Historical',
    description: 'Notorious Cold War espionage shortwave & longwave numbers station used by Britain\'s Secret Intelligence Service (MI6) to send one-time pad cipher messages to undercover operatives.',
    historicalNote: 'Broadcasts the first two bars of the English folk song "The Lincolnshire Poacher" played on an electronic organ / music box chime, followed by a calm female voice reading 5-digit number groups.',
    coordinates: { lat: 34.587, lng: 32.984 },
    audioProfile: {
      type: 'music_box',
      speechScript: [
        'Three, nine, seven, one, five.',
        'Zero, eight, four, two, six.',
        'Five, five, one, zero, nine.',
        'Eight, two, three, four, one.',
        'Seven, zero, zero, six, two.'
      ]
    }
  },
  {
    id: 'navtex_518',
    frequency: 518.0,
    callsign: 'NAVTEX 518',
    name: 'International NAVTEX Maritime Safety',
    country: 'International',
    location: 'Global Coastal Radio Stations (IMO / GMDSS)',
    powerKw: 1,
    category: 'maritime_navtex',
    defaultMode: 'DATA',
    defaultBandwidth: 2.4,
    activeStatus: 'Active',
    description: 'International Maritime Organization (IMO) automatic direct-printing telegraphy broadcasting navigational hazards, meteorological warnings, and search-and-rescue alerts to ships at sea.',
    historicalNote: 'Uses SITOR-B forward error correction with 100 baud FSK (1700 Hz center frequency, 170 Hz shift). Shipboard receivers print message tapes automatically even while crew sleeps.',
    coordinates: { lat: 50.8, lng: 1.2 },
    audioProfile: {
      type: 'fsk'
    }
  },
  {
    id: 'navtex_490',
    frequency: 490.0,
    callsign: 'NAVTEX 490',
    name: 'National Coastal NAVTEX Service',
    country: 'Coastal Nations',
    location: 'Local Coastal Stations',
    powerKw: 1,
    category: 'maritime_navtex',
    defaultMode: 'DATA',
    defaultBandwidth: 2.4,
    activeStatus: 'Active',
    description: 'National language broadcasts for inshore craft, fishing fleets, and harbor masters carrying local coastal notices to mariners.',
    historicalNote: 'Operating on 490 kHz, this channel frees the 518 kHz international frequency for high-priority ocean-going traffic.',
    coordinates: { lat: 53.5, lng: 8.5 },
    audioProfile: {
      type: 'fsk'
    }
  },
  {
    id: 'rtl_234',
    frequency: 234.0,
    callsign: 'RTL 234',
    name: 'Radio Télévision Luxembourg (Beidweiler)',
    country: 'Luxembourg',
    location: 'Beidweiler Transmitting Station',
    powerKw: 2000,
    category: 'broadcast',
    defaultMode: 'AM',
    defaultBandwidth: 9.0,
    activeStatus: 'Historical',
    description: 'One of the most famous and powerful longwave broadcast stations in radio history, transmitting across Western Europe with up to 2 Megawatts.',
    historicalNote: 'During the 1960s to 1980s, RTL and its English service revolutionized commercial European broadcasting, bypassing national radio monopolies.',
    coordinates: { lat: 49.728, lng: 6.329 },
    audioProfile: {
      type: 'speech',
      speechScript: [
        'Ici Radio Télévision Luxembourg, sur grandes ondes, deux cent trente-quatre kilohercs. Vous écoutez le journal de midi.',
        'L\'actualité européenne, musique et divertissement en direct de Luxembourg.'
      ]
    }
  },
  {
    id: 'rmc_216',
    frequency: 216.0,
    callsign: 'RMC 216',
    name: 'Radio Monte Carlo (Roumoules)',
    country: 'Monaco / France',
    location: 'Roumoules Transmitter, Alpes-de-Haute-Provence',
    powerKw: 1400,
    category: 'broadcast',
    defaultMode: 'AM',
    defaultBandwidth: 9.0,
    activeStatus: 'Historical',
    description: 'Massive directional longwave transmitter situated on the Plateau de Valensole, broadcasting to southern France, Italy, and the Mediterranean.',
    historicalNote: 'Its directional curtain antenna array consisted of three 300m masts pointing RF energy directly towards Paris and the Mediterranean basin.',
    coordinates: { lat: 43.799, lng: 6.155 },
    audioProfile: {
      type: 'speech',
      speechScript: [
        'Radio Monte-Carlo, cent pour cent sport et info. Vous êtes bien à l\'écoute de RMC sur grandes ondes.'
      ]
    }
  },
  {
    id: 'antena_satelor_153',
    frequency: 153.0,
    callsign: 'Antena Satelor',
    name: 'Radio Romania Antena Satelor',
    country: 'Romania',
    location: 'Bod Transmitting Center, Brașov County',
    powerKw: 200,
    category: 'broadcast',
    defaultMode: 'AM',
    defaultBandwidth: 9.0,
    activeStatus: 'Active',
    description: 'Broadcasts Romanian folk music, rural news, and agricultural reports deep into the Carpathian mountain valleys where FM cannot penetrate.',
    historicalNote: 'Bod is one of Europe\'s historic pioneer transmitters, established in the 1930s under radio engineer Guglielmo Marconi\'s technical consultation.',
    coordinates: { lat: 45.760, lng: 25.603 },
    audioProfile: {
      type: 'speech',
      speechScript: [
        'Aici Radio România Antena Satelor, vocea satului românesc. Transmitem pe frecvența de o sută cincizeci și trei de kiloherți.'
      ]
    }
  },
  {
    id: 'allouis_162',
    frequency: 162.0,
    callsign: 'TDF Allouis',
    name: 'TDF Allouis Time Signal',
    country: 'France',
    location: 'Allouis, Cher, Centre-Val de Loire',
    powerKw: 800,
    category: 'time_signal',
    defaultMode: 'AM',
    defaultBandwidth: 6.0,
    activeStatus: 'Active',
    description: 'French national atomic time code reference transmitter, transmitting continuous precision carrier phase-modulated standard time signals.',
    historicalNote: 'Though voice broadcasts ceased in 2016, the French government retained the high-power carrier to discipline French railway track signaling and synchronization systems.',
    coordinates: { lat: 47.169, lng: 2.203 },
    audioProfile: {
      type: 'time_ticks'
    }
  },
  {
    id: 'vlf_natural',
    frequency: 12.5,
    callsign: 'VLF NAT',
    name: 'Earth Natural VLF Radio & Whistlers',
    country: 'Earth Ionosphere',
    location: 'Magnetospheric Waveguide',
    powerKw: 0,
    category: 'natural_vlf',
    defaultMode: 'CW',
    defaultBandwidth: 2.4,
    activeStatus: 'Active',
    description: 'Natural electromagnetic emissions produced by planetary lightning discharges that bounce thousands of kilometers through magnetic field lines.',
    historicalNote: 'When lightning strikes, electromagnetic pulses travel along Earth\'s magnetic flux lines through the magnetosphere. High frequencies arrive before low frequencies, creating the distinctive falling whistling tone.',
    coordinates: { lat: 0, lng: 0 },
    audioProfile: {
      type: 'natural_chirp'
    }
  }
];

export const NAVTEX_SAMPLE_MESSAGES = [
  {
    id: 'nav-01',
    header: 'ZCZC EA44 211900 UTC',
    station: 'NITON RADIO (E)',
    subject: 'GALE WARNING & NAVIGATIONAL HAZARD',
    text: `SOUTH-WEST APPROACHES:
WINDS SOUTH-WESTERLY GALE FORCE 8 TO SEVERE GALE FORCE 9 IMMINENT.
SEAS ROUGH TO VERY ROUGH WITH SWELL 4 TO 6 METRES.
VISIBILITY MODERATE OCCASIONALLY POOR IN HEAVY RAIN SQUALLS.
WARNING: UNLIT DRIFTING 40-FOOT SHIPPING CONTAINER REPORTED VICINITY 49-32N 005-18W.
VESSELS IN VICINITY KEEP SHARP LOOKOUT AND NAVIGATE WITH CAUTION.
NNNN`
  },
  {
    id: 'nav-02',
    header: 'ZCZC MA12 211830 UTC',
    station: 'OOSTENDE RADIO (M)',
    subject: 'SEARCH AND RESCUE RELAY / DISTRESS',
    text: `DOVER STRAIT TSS:
FISHING VESSEL 'NORDIC DAWN' REPORTED LOSS OF STEERING 12 NM EAST OF DUNGENESS.
TUG IN ATTENDANCE. A 0.5 NM EXCLUSION ZONE REQUESTED.
SHIPPING TO KEEP WIDE BERTH.
NNNN`
  },
  {
    id: 'nav-03',
    header: 'ZCZC PA09 211745 UTC',
    station: 'CULLERCOATS (G)',
    subject: 'GUNNERY EXERCISE & ICE WARNING',
    text: `NORTH SEA CENTRAL:
LIVE FIRING EXERCISES SCHEDULED VICINITY 56-10N 001-45E.
CHANNELS RESTRICTED TO NAVIGATIONAL TRANSIT.
SPECIAL BUOYS ESTABLISHED.
NNNN`
  }
];
