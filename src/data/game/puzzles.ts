export interface WordDefinition {
  no: string;
  en: string;
  ru: string;
  uk: string;
}

export interface WordEntry {
  word: string;
  points: number;
  isPangram?: boolean;
  def: WordDefinition;
}

export interface DailyPuzzle {
  id: number;
  center: string;
  letters: string[]; // 6 outer letters
  words: WordEntry[];
}

// Puzzles cycle by day-of-week (0=Sun … 6=Sat).
// Every word MUST contain the center letter and be ≥ 4 letters.
// Letters may be reused. Pangram = uses all 7 unique letters.
export const PUZZLES: DailyPuzzle[] = [
  // ── Puzzle 0 · Sunday · Theme: Nature ──────────────────────────────────
  {
    id: 0,
    center: 'A',
    letters: ['N', 'T', 'U', 'R', 'G', 'E'],
    words: [
      {
        word: 'NATUR',
        points: 5,
        def: {
          no: 'verden rundt oss — trær, fjell, hav og luft',
          en: 'nature',
          ru: 'природа',
          uk: 'природа',
        },
      },
      {
        word: 'TRANG',
        points: 5,
        def: {
          no: 'smal, ikke romslig; også: sterk trang til noe',
          en: 'narrow; strong urge',
          ru: 'тесный; сильное желание',
          uk: 'тісний; сильне бажання',
        },
      },
      {
        word: 'GRAN',
        points: 4,
        def: {
          no: 'eviggrønt tre med nåler, vanlig i norsk skog',
          en: 'spruce tree',
          ru: 'ель',
          uk: 'ялина',
        },
      },
      {
        word: 'GARN',
        points: 4,
        def: {
          no: 'tykk tråd brukt til strikking; også: fiskenett',
          en: 'yarn (for knitting); fishing net',
          ru: 'пряжа; рыболовная сеть',
          uk: 'пряжа; рибальська сітка',
        },
      },
      {
        word: 'GATE',
        points: 4,
        def: {
          no: 'vei i en by med bygninger på begge sider',
          en: 'street',
          ru: 'улица',
          uk: 'вулиця',
        },
      },
      {
        word: 'GATER',
        points: 5,
        def: {
          no: 'flertall av gate',
          en: 'streets',
          ru: 'улицы',
          uk: 'вулиці',
        },
      },
      {
        word: 'TANTE',
        points: 5,
        def: {
          no: 'søster av mor eller far',
          en: 'aunt',
          ru: 'тётя',
          uk: 'тітка',
        },
      },
      {
        word: 'ANGRE',
        points: 5,
        def: {
          no: 'å føle seg lei for noe man har gjort',
          en: 'to regret',
          ru: 'сожалеть, раскаиваться',
          uk: 'жалкувати, каятися',
        },
      },
      {
        word: 'RANG',
        points: 4,
        def: {
          no: 'fortid av å ringe — ringte telefonen',
          en: 'rang (past tense of "to ring")',
          ru: 'звонил (прош. вр. от "ringe")',
          uk: 'дзвонив (мин. час від "ringe")',
        },
      },
      {
        word: 'GANG',
        points: 4,
        def: {
          no: 'korridor i huset; én forekomst av noe ("én gang")',
          en: 'hallway; one occurrence ("once")',
          ru: 'коридор; один раз',
          uk: 'коридор; один раз',
        },
      },
      {
        word: 'GANGE',
        points: 5,
        def: {
          no: 'å multiplisere; "tre ganger" = 3 ×',
          en: 'to multiply; "times" (×)',
          ru: 'умножать; "раза" (×)',
          uk: 'множити; "рази" (×)',
        },
      },
      {
        word: 'RANTE',
        points: 5,
        def: {
          no: 'fortid av å rante — klaget høylytt og irritert',
          en: 'ranted (past tense)',
          ru: 'бурчал, ворчал',
          uk: 'буркотів, скаржився',
        },
      },
      {
        word: 'GRANE',
        points: 5,
        def: {
          no: 'en gren av en gran (regionalt ord)',
          en: 'a branch of spruce (dialectal)',
          ru: 'ветвь ели (диалект)',
          uk: 'гілка ялини (діалект)',
        },
      },
      {
        word: 'NATUREN',
        points: 7,
        def: {
          no: 'den bestemt form av natur — "naturen er vakker"',
          en: 'the nature (definite form)',
          ru: 'природа (определённая форма)',
          uk: 'природа (визначена форма)',
        },
      },
    ],
  },

  // ── Puzzle 1 · Monday · Theme: School & Learning ───────────────────────
  {
    id: 1,
    center: 'E',
    letters: ['S', 'K', 'O', 'L', 'R', 'I'],
    words: [
      {
        word: 'SKOLE',
        points: 5,
        def: {
          no: 'sted der barn og unge lærer fag',
          en: 'school',
          ru: 'школа',
          uk: 'школа',
        },
      },
      {
        word: 'SKOLER',
        points: 6,
        def: {
          no: 'flertall av skole',
          en: 'schools',
          ru: 'школы',
          uk: 'школи',
        },
      },
      {
        word: 'ELSKE',
        points: 5,
        def: {
          no: 'å ha sterk kjærlighetsfølelse for noen',
          en: 'to love',
          ru: 'любить',
          uk: 'кохати, любити',
        },
      },
      {
        word: 'LEKE',
        points: 4,
        def: {
          no: 'å more seg, drive med lek',
          en: 'to play',
          ru: 'играть',
          uk: 'гратися',
        },
      },
      {
        word: 'REKKE',
        points: 5,
        def: {
          no: 'en rad av ting; å rekke = å klare å gjøre noe i tide',
          en: 'row/series; to manage (in time)',
          ru: 'ряд; успеть (сделать вовремя)',
          uk: 'ряд; встигнути (зробити вчасно)',
        },
      },
      {
        word: 'KRISE',
        points: 5,
        def: {
          no: 'en vanskelig og kritisk situasjon',
          en: 'crisis',
          ru: 'кризис',
          uk: 'криза',
        },
      },
      {
        word: 'SIKRE',
        points: 5,
        def: {
          no: 'å gjøre trygt; å sikre seg noe',
          en: 'to secure; to make sure of',
          ru: 'обезопасить; обеспечить',
          uk: 'убезпечити; забезпечити',
        },
      },
      {
        word: 'SKORE',
        points: 5,
        def: {
          no: 'å score — å gjøre mål eller oppnå noe positivt',
          en: 'to score',
          ru: 'забить гол; заработать очки',
          uk: 'забити гол; заробити очки',
        },
      },
      {
        word: 'SERIE',
        points: 5,
        def: {
          no: 'en rekke ting i bestemt rekkefølge',
          en: 'series',
          ru: 'серия',
          uk: 'серія',
        },
      },
      {
        word: 'LESER',
        points: 5,
        def: {
          no: 'nåtid av å lese; en person som leser',
          en: 'reads; reader',
          ru: 'читает; читатель',
          uk: 'читає; читач',
        },
      },
      {
        word: 'SILE',
        points: 4,
        def: {
          no: 'å filtrere væske gjennom en sil',
          en: 'to strain/filter',
          ru: 'процеживать',
          uk: 'проціджувати',
        },
      },
      {
        word: 'RISLE',
        points: 5,
        def: {
          no: 'å renne stille og jevnt, som en liten bekk',
          en: 'to trickle, babble (of a stream)',
          ru: 'журчать, тихо течь',
          uk: 'дзюрчати, тихо текти',
        },
      },
      {
        word: 'KOKE',
        points: 4,
        def: {
          no: 'å varme opp vann til 100 °C; å tilberede mat',
          en: 'to boil; to cook',
          ru: 'кипятить; варить',
          uk: 'кип\'ятити; варити',
        },
      },
      {
        word: 'KOKER',
        points: 5,
        def: {
          no: 'nåtid av å koke; en koker = beholder for piler',
          en: 'boils; a quiver (for arrows)',
          ru: 'кипит; колчан',
          uk: 'кипить; колчан',
        },
      },
      {
        word: 'ROSE',
        points: 4,
        def: {
          no: 'vakker blomst med duft; å rose = å berømme noen',
          en: 'rose (flower); to praise',
          ru: 'роза; хвалить',
          uk: 'троянда; хвалити',
        },
      },
      {
        word: 'SIRKLE',
        points: 6,
        def: {
          no: 'å bevege seg i sirkler rundt noe',
          en: 'to circle around',
          ru: 'кружить, описывать круги',
          uk: 'кружляти, описувати кола',
        },
      },
      {
        word: 'KORLEIS',
        points: 7,
        isPangram: true,
        def: {
          no: 'nynorsk for "hvordan" — brukt i hele landet',
          en: 'how (Nynorsk form, widely understood)',
          ru: 'как (форма нюношк — "как дела?")',
          uk: 'як (форма нюношк — "як справи?")',
        },
      },
    ],
  },

  // ── Puzzle 2 · Tuesday · Theme: Action & Movement ──────────────────────
  {
    id: 2,
    center: 'I',
    letters: ['V', 'N', 'G', 'E', 'R', 'K'],
    words: [
      {
        word: 'RING',
        points: 4,
        def: {
          no: 'sirkelformet gjenstand; å ringe = å telefonere',
          en: 'ring; to phone',
          ru: 'кольцо; звонить',
          uk: 'каблучка; дзвонити',
        },
      },
      {
        word: 'RIKE',
        points: 4,
        def: {
          no: 'et kongerike; rik = velstående',
          en: 'kingdom; rich',
          ru: 'королевство; богатый',
          uk: 'королівство; багатий',
        },
      },
      {
        word: 'RINGE',
        points: 5,
        def: {
          no: 'å telefonere noen — "ringe en venn"',
          en: 'to call (by phone)',
          ru: 'звонить (по телефону)',
          uk: 'дзвонити (по телефону)',
        },
      },
      {
        word: 'VINGE',
        points: 5,
        def: {
          no: 'det fugler bruker til å fly med',
          en: 'wing',
          ru: 'крыло',
          uk: 'крило',
        },
      },
      {
        word: 'RIVE',
        points: 4,
        def: {
          no: 'å reve i stykker; å rive ned en bygning',
          en: 'to tear; to demolish',
          ru: 'рвать; сносить',
          uk: 'рвати; зносити',
        },
      },
      {
        word: 'RIVER',
        points: 5,
        def: {
          no: 'nåtid av å rive; en river = et redskap',
          en: 'tears/rips; a rake (tool)',
          ru: 'рвёт; грабли (инструмент)',
          uk: 'рве; граблі (інструмент)',
        },
      },
      {
        word: 'GRINE',
        points: 5,
        def: {
          no: 'å gråte eller klage — "ikke grin nå!"',
          en: 'to cry; to whine',
          ru: 'плакать; хныкать',
          uk: 'плакати; хникати',
        },
      },
      {
        word: 'GRINER',
        points: 6,
        def: {
          no: 'nåtid av å grine; en griner = gneldrefant',
          en: 'cries; a crybaby/whiner',
          ru: 'плачет; нытик',
          uk: 'плаче; нитик',
        },
      },
      {
        word: 'VIRKE',
        points: 5,
        def: {
          no: 'å fungere; å virke = å se ut som — "det virker bra"',
          en: 'to seem; to work/function',
          ru: 'казаться; работать, функционировать',
          uk: 'здаватися; працювати, функціонувати',
        },
      },
      {
        word: 'VIRKER',
        points: 6,
        def: {
          no: 'nåtid av å virke — "det virker ikke"',
          en: 'seems; works (3rd person)',
          ru: 'кажется; работает',
          uk: 'здається; працює',
        },
      },
      {
        word: 'KNIRKE',
        points: 6,
        def: {
          no: 'å lage skrikende lyd — "gulvet knirket"',
          en: 'to creak, squeak',
          ru: 'скрипеть',
          uk: 'скрипіти',
        },
      },
      {
        word: 'KVIKK',
        points: 5,
        def: {
          no: 'rask og energisk; lys og oppvakt',
          en: 'quick, lively, alert',
          ru: 'быстрый, живой, бодрый',
          uk: 'швидкий, жвавий, бадьорий',
        },
      },
      {
        word: 'VIKING',
        points: 6,
        def: {
          no: 'nordisk sjøfarer og kriger fra 800–1100-tallet',
          en: 'Viking',
          ru: 'викинг',
          uk: 'вікінг',
        },
      },
      {
        word: 'VIKER',
        points: 5,
        def: {
          no: 'å vike unna noe — "viker ikke fra målet"',
          en: 'gives way, yields',
          ru: 'отступает, уступает',
          uk: 'відступає, поступається',
        },
      },
      {
        word: 'GREIN',
        points: 5,
        def: {
          no: 'gren på et tre (dialektform, mye brukt)',
          en: 'branch of a tree (dialectal, widely used)',
          ru: 'ветка дерева (диалект, широко используется)',
          uk: 'гілка дерева (діалект, широко вживається)',
        },
      },
    ],
  },

  // ── Puzzle 3 · Wednesday · Theme: Earth & Nature ───────────────────────
  {
    id: 3,
    center: 'O',
    letters: ['H', 'J', 'R', 'D', 'E', 'N'],
    words: [
      {
        word: 'JORD',
        points: 4,
        def: {
          no: 'jorden vi går på; landbruksmark',
          en: 'earth, soil; farmland',
          ru: 'земля, почва; сельскохозяйственные угодья',
          uk: 'земля, ґрунт; сільськогосподарські угіддя',
        },
      },
      {
        word: 'JORDER',
        points: 6,
        def: {
          no: 'flertall av jord — jordstykker og marker',
          en: 'plots of land, fields',
          ru: 'участки земли, поля',
          uk: 'ділянки землі, поля',
        },
      },
      {
        word: 'ORDEN',
        points: 5,
        def: {
          no: 'system og ryddighet; "holde orden"',
          en: 'order, tidiness',
          ru: 'порядок',
          uk: 'порядок',
        },
      },
      {
        word: 'HORDE',
        points: 5,
        def: {
          no: 'stor og kaotisk gruppe av folk eller dyr',
          en: 'horde, mob',
          ru: 'орда, толпа',
          uk: 'орда, натовп',
        },
      },
      {
        word: 'DRONE',
        points: 5,
        def: {
          no: 'ubemannet luftfartøy styrt på avstand',
          en: 'drone (unmanned aircraft)',
          ru: 'дрон (беспилотник)',
          uk: 'дрон (безпілотник)',
        },
      },
      {
        word: 'DRONER',
        points: 6,
        def: {
          no: 'flertall av drone; å drone = å brumme lavt',
          en: 'drones; drones (buzzing sound)',
          ru: 'дроны; гудит',
          uk: 'дрони; гуде',
        },
      },
      {
        word: 'HORN',
        points: 4,
        def: {
          no: 'hardt fremspring på hodet av dyr; blåseinstrument',
          en: 'horn (animal or instrument)',
          ru: 'рог (животного или инструмент)',
          uk: 'ріг (тварини або інструмент)',
        },
      },
      {
        word: 'DONOR',
        points: 5,
        def: {
          no: 'person som gir blod, organer eller penger',
          en: 'donor',
          ru: 'донор',
          uk: 'донор',
        },
      },
      {
        word: 'NORDHODE',
        points: 8,
        def: {
          no: 'Nord-europeer; en som er fra nord (sammensatt ord)',
          en: 'northerner (compound word)',
          ru: 'северянин (составное слово)',
          uk: 'північанин (складне слово)',
        },
      },
      {
        word: 'JORDE',
        points: 5,
        def: {
          no: 'å jorde = å koble til jord i strøm; å gravlegge (dialekt)',
          en: 'to ground (electrical); to bury (dialectal)',
          ru: 'заземлять; хоронить (диалект)',
          uk: 'заземлити; ховати (діалект)',
        },
      },
      {
        word: 'HORDENE',
        points: 7,
        isPangram: true,
        def: {
          no: 'bestemt flertall av horde — "hordene stormet inn"',
          en: 'the hordes (definite plural)',
          ru: 'орды (определённое мн. ч.)',
          uk: 'орди (визначена мн. форма)',
        },
      },
    ],
  },

  // ── Puzzle 4 · Thursday · Theme: Home & Feelings ───────────────────────
  {
    id: 4,
    center: 'E',
    letters: ['H', 'J', 'M', 'S', 'R', 'T'],
    words: [
      {
        word: 'HEST',
        points: 4,
        def: {
          no: 'stort dyr vi rir på',
          en: 'horse',
          ru: 'лошадь',
          uk: 'кінь',
        },
      },
      {
        word: 'HESTER',
        points: 6,
        def: {
          no: 'flertall av hest',
          en: 'horses',
          ru: 'лошади',
          uk: 'коні',
        },
      },
      {
        word: 'MEST',
        points: 4,
        def: {
          no: 'i størst grad — "det er mest sant"',
          en: 'most (adverb)',
          ru: 'больше всего, наиболее',
          uk: 'найбільше, найбільш',
        },
      },
      {
        word: 'SETTE',
        points: 5,
        def: {
          no: 'å plassere noe et sted — "sett det her"',
          en: 'to put, set, place',
          ru: 'ставить, класть',
          uk: 'ставити, класти',
        },
      },
      {
        word: 'SETTER',
        points: 6,
        def: {
          no: 'nåtid av å sette; en setter = en hundrase',
          en: 'puts/sets; a setter (dog breed)',
          ru: 'ставит; сеттер (порода)',
          uk: 'ставить; сетер (порода собак)',
        },
      },
      {
        word: 'ETTER',
        points: 5,
        def: {
          no: 'forposisjon som viser tid eller rekkefølge',
          en: 'after (preposition)',
          ru: 'после (предлог)',
          uk: 'після (прийменник)',
        },
      },
      {
        word: 'HJERTE',
        points: 6,
        def: {
          no: 'organet som pumper blod; symbolet for kjærlighet',
          en: 'heart',
          ru: 'сердце',
          uk: 'серце',
        },
      },
      {
        word: 'HJEM',
        points: 4,
        def: {
          no: 'stedet der man bor og hører til',
          en: 'home',
          ru: 'дом (родной)',
          uk: 'дім (рідний)',
        },
      },
      {
        word: 'HJEMME',
        points: 6,
        def: {
          no: 'å være hjemme — ikke ute',
          en: 'at home',
          ru: 'дома',
          uk: 'вдома',
        },
      },
      {
        word: 'VERT',
        points: 4,
        def: {
          no: 'person som tar imot gjester; eier av et sted',
          en: 'host; landlord',
          ru: 'хозяин (гостеприимный); хозяин жилья',
          uk: 'господар (гостинний); власник житла',
        },
      },
      {
        word: 'VERTER',
        points: 6,
        def: {
          no: 'flertall av vert',
          en: 'hosts; landlords',
          ru: 'хозяева',
          uk: 'господарі',
        },
      },
      {
        word: 'HVERT',
        points: 5,
        def: {
          no: 'brukt i uttrykk som "hvert år" = every year',
          en: 'each, every',
          ru: 'каждый',
          uk: 'кожний',
        },
      },
      {
        word: 'HERSE',
        points: 5,
        def: {
          no: 'å dominere eller kommandere folk rundt seg',
          en: 'to boss around, domineer',
          ru: 'командовать, помыкать',
          uk: 'командувати, понукати',
        },
      },
      {
        word: 'HERSER',
        points: 6,
        def: {
          no: 'nåtid av å herse',
          en: 'bosses around',
          ru: 'командует, помыкает',
          uk: 'командує, понукає',
        },
      },
      {
        word: 'HERME',
        points: 5,
        def: {
          no: 'å etterligne noen, å herme etter',
          en: 'to mimic, imitate',
          ru: 'передразнивать, имитировать',
          uk: 'передражнювати, імітувати',
        },
      },
      {
        word: 'STRESSE',
        points: 7,
        def: {
          no: 'å oppleve stress; å ha det travelt og anspent',
          en: 'to stress; to be under stress',
          ru: 'переживать стресс; нервничать',
          uk: 'переживати стрес; нервувати',
        },
      },
    ],
  },

  // ── Puzzle 5 · Friday · Theme: People & Society ────────────────────────
  {
    id: 5,
    center: 'S',
    letters: ['I', 'G', 'N', 'E', 'R', 'T'],
    words: [
      {
        word: 'STEIN',
        points: 5,
        def: {
          no: 'fast mineralstoff — "en stein på veien"',
          en: 'stone, rock',
          ru: 'камень',
          uk: 'камінь',
        },
      },
      {
        word: 'STEINER',
        points: 7,
        def: {
          no: 'flertall av stein; Rudolf Steiner = pedagog',
          en: 'stones, rocks; a proper name',
          ru: 'камни; имя собственное',
          uk: 'каміння; власне ім\'я',
        },
      },
      {
        word: 'SITRE',
        points: 5,
        def: {
          no: 'å skjelve av kulde, frykt eller spenning',
          en: 'to tremble, quiver, shiver',
          ru: 'дрожать, трепетать',
          uk: 'тремтіти, дрижати',
        },
      },
      {
        word: 'SITRER',
        points: 6,
        def: {
          no: 'nåtid av å sitre — "hånden sitrer"',
          en: 'trembles, quivers',
          ru: 'дрожит, трепещет',
          uk: 'тремтить, дрижить',
        },
      },
      {
        word: 'NISTE',
        points: 5,
        def: {
          no: 'matpakke man tar med seg på jobb eller skole',
          en: 'packed lunch',
          ru: 'домашний ланч, еда с собой',
          uk: 'домашній ланч, їжа з собою',
        },
      },
      {
        word: 'GRISE',
        points: 5,
        def: {
          no: 'å lage rot og søl; en gris = et pattedyr',
          en: 'to make a mess; a pig',
          ru: 'свинячить; свинья',
          uk: 'бруднити; свиня',
        },
      },
      {
        word: 'GRISER',
        points: 6,
        def: {
          no: 'flertall av gris; nåtid av å grise',
          en: 'pigs; makes a mess',
          ru: 'свиньи; свинячит',
          uk: 'свині; бруднить',
        },
      },
      {
        word: 'STING',
        points: 5,
        def: {
          no: 'stikk av insekt; en sting = ett systing',
          en: 'sting; a stitch (sewing)',
          ru: 'укус (насекомого); стежок',
          uk: 'укус (комахи); стібок',
        },
      },
      {
        word: 'SNITT',
        points: 5,
        def: {
          no: 'et kutt; gjennomsnitt = middelverdien',
          en: 'a cut; average',
          ru: 'разрез; среднее значение',
          uk: 'розріз; середнє значення',
        },
      },
      {
        word: 'STIG',
        points: 4,
        def: {
          no: 'å stige = å gå opp; Stig er et norsk navn',
          en: 'climb (imperative); a Norwegian name',
          ru: 'карабкайся (повел.); норвежское имя',
          uk: 'карабкайся (наказ.); норвезьке ім\'я',
        },
      },
      {
        word: 'SIGNER',
        points: 6,
        def: {
          no: 'flertall av signering; å signe (signere)',
          en: 'signings; to sign (informal)',
          ru: 'подписания; подписать',
          uk: 'підписання; підписати',
        },
      },
      {
        word: 'GRESS',
        points: 5,
        def: {
          no: 'grønt planter som dekker bakken',
          en: 'grass',
          ru: 'трава',
          uk: 'трава',
        },
      },
      {
        word: 'GRENSE',
        points: 6,
        def: {
          no: 'linje som skiller to stater eller områder',
          en: 'border, limit',
          ru: 'граница, предел',
          uk: 'кордон, межа',
        },
      },
      {
        word: 'GRENSER',
        points: 7,
        def: {
          no: 'flertall av grense; nåtid av å grense (til)',
          en: 'borders; borders on (verb)',
          ru: 'границы; граничит с',
          uk: 'кордони; межує з',
        },
      },
      {
        word: 'SIGNERT',
        points: 7,
        isPangram: true,
        def: {
          no: 'underskrevet — "signert kontrakt"',
          en: 'signed (past participle)',
          ru: 'подписанный',
          uk: 'підписаний',
        },
      },
    ],
  },

  // ── Puzzle 6 · Saturday · Theme: Work & Everyday Life ──────────────────
  {
    id: 6,
    center: 'A',
    letters: ['R', 'B', 'E', 'I', 'D', 'S'],
    words: [
      {
        word: 'BADE',
        points: 4,
        def: {
          no: 'å vaske seg i badekar eller svømme i vann',
          en: 'to bathe; to swim',
          ru: 'купаться',
          uk: 'купатися',
        },
      },
      {
        word: 'BADER',
        points: 5,
        def: {
          no: 'nåtid av å bade; baderom',
          en: 'bathes; bathroom (informal)',
          ru: 'купается',
          uk: 'купається',
        },
      },
      {
        word: 'BARE',
        points: 4,
        def: {
          no: 'kun, bare — "bare litt"; naken = bar',
          en: 'just, only; bare',
          ru: 'только, лишь; голый',
          uk: 'лише, тільки; голий',
        },
      },
      {
        word: 'RADE',
        points: 4,
        def: {
          no: 'en rad; å rade opp = å stille i rekke',
          en: 'a row; to line up',
          ru: 'ряд; выстраивать',
          uk: 'ряд; вишиковувати',
        },
      },
      {
        word: 'RADER',
        points: 5,
        def: {
          no: 'flertall av rad',
          en: 'rows',
          ru: 'ряды',
          uk: 'ряди',
        },
      },
      {
        word: 'RASERI',
        points: 6,
        def: {
          no: 'ekstrem sinne — "full av raseri"',
          en: 'rage, fury',
          ru: 'ярость, бешенство',
          uk: 'лють, шаленство',
        },
      },
      {
        word: 'ARBEID',
        points: 6,
        def: {
          no: 'det man gjør for å tjene penger; jobb',
          en: 'work, labor',
          ru: 'работа, труд',
          uk: 'робота, праця',
        },
      },
      {
        word: 'ARBEIDE',
        points: 7,
        def: {
          no: 'å jobbe, å arbeide',
          en: 'to work',
          ru: 'работать',
          uk: 'працювати',
        },
      },
      {
        word: 'BRASE',
        points: 5,
        def: {
          no: 'å steke kjøtt raskt på høy varme',
          en: 'to sear, braise meat',
          ru: 'обжаривать мясо на сильном огне',
          uk: 'обсмажувати м\'ясо на сильному вогні',
        },
      },
      {
        word: 'BASERE',
        points: 6,
        def: {
          no: 'å basere seg på noe — å bygge på et grunnlag',
          en: 'to base (on something)',
          ru: 'основываться (на чём-либо)',
          uk: 'ґрунтуватися (на чомусь)',
        },
      },
      {
        word: 'ARBEIDER',
        points: 8,
        def: {
          no: 'en som arbeider; arbeiderklassen',
          en: 'worker; working class person',
          ru: 'рабочий; работник',
          uk: 'робітник; трудівник',
        },
      },
      {
        word: 'BARER',
        points: 5,
        def: {
          no: 'flertall av bar (drikkested)',
          en: 'bars (drinking places)',
          ru: 'бары',
          uk: 'бари',
        },
      },
      {
        word: 'BREDDE',
        points: 6,
        def: {
          no: 'avstand fra side til side; bredde = width',
          en: 'width, breadth',
          ru: 'ширина',
          uk: 'ширина',
        },
      },
      {
        word: 'SIDE',
        points: 4,
        def: {
          no: 'en side av noe — side i en bok; retning',
          en: 'side; page (of a book)',
          ru: 'сторона; страница (книги)',
          uk: 'сторона; сторінка (книги)',
        },
      },
    ],
  },
];

export function getTodaysPuzzle(): DailyPuzzle {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  return PUZZLES[day];
}

export function getPuzzleById(id: number): DailyPuzzle {
  return PUZZLES[id % PUZZLES.length];
}

// ЛОКАЛЬНАЯ дата, не UTC: паззл выбирается по локальному дню недели
// (getTodaysPuzzle), поэтому ключ сохранений/лидерборда обязан переключаться
// в ту же локальную полночь — иначе после 00:00 старые сохранения грузятся
// против нового паззла, а очки уходят на вчерашний лидерборд.
// Одинаковая локальная дата ⇒ одинаковый день недели ⇒ одинаковый паззл во
// всех часовых поясах, так что ключ остаётся глобально согласованным.
export function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // YYYY-MM-DD
}

export function calcPangramBonus(word: string, puzzle: DailyPuzzle): boolean {
  const allLetters = new Set([puzzle.center, ...puzzle.letters]);
  return [...allLetters].every(l => word.includes(l));
}
