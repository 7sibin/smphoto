/**
 * Tekst je preuzet iz dizajna (I18N mapa u "Galerija po kodu (desktop).dc.html").
 * Dopunjen je kljucevima za gotovinski tok, jer se panel iz prototipa —
 * "Potvrdi i otkljucaj" koji sam korisnik klikne — ovde ne moze zadrzati:
 * nivo pristupa odredjuje iskljucivo server.
 */

export type Lang = "bs" | "en";
export const DEFAULT_LANG: Lang = "bs";

type Entry = [bs: string, en: string];

export const STRINGS = {
  appName: ["Preuzmi svoje fotografije", "Get your photos"],
  helpLine: ["Pomoć na bazi: +387 65 000 000", "Help at the base: +387 65 000 000"],
  phone: ["+38765000000", "+38765000000"],

  codeKicker: ["Kartica sa spusta", "Card from the river"],
  codeTitleA: ["Ukucaj kod", "Enter your"],
  codeTitleB: ["svoje grupe", "group code"],
  codeBody: [
    "Kod od osam znakova je na kartici koju ste dobili na bazi. Otvara sve fotografije vašeg čamca — cijelu galeriju grupe, kao jedan paket.",
    "The eight-character code is on the card you got at the base. It opens every photo from your raft — the whole group gallery, as one package.",
  ],
  codeLabel: ["Kod galerije", "Gallery code"],
  codeCta: ["Otvori galeriju", "Open gallery"],
  codeChecking: ["Provjeravam…", "Checking…"],
  noCode: ["Nemate kod ili ste izgubili karticu?", "No code, or lost the card?"],
  byDateCta: ["Pregled po datumu", "Browse by date"],

  back: ["Nazad", "Back"],
  allRuns: ["Svi termini", "All runs"],
  datesTitle: ["Pregled po datumu", "Browse by date"],
  datesBody: [
    "Izaberite dan spusta pa svoj termin. Spisak termina je javan, ali fotografije otvara samo kod sa kartice.",
    "Pick the day of your descent, then your run. The list of runs is public, but only the card code opens the photos.",
  ],
  datesRunCta: ["Otvori kodom", "Open with code"],
  datesEmpty: ["još nema slika", "no photos yet"],
  runsWord: ["termina", "runs"],
  datesLoadFail: ["Ne mogu da učitam dane.", "Could not load the days."],

  lockedNote: ["Pregled sa vodenim žigom", "Watermarked preview"],
  wholeGallery: ["cijela galerija grupe", "the whole group gallery"],
  unlockCta: ["Otključaj galeriju", "Unlock gallery"],
  photos: ["slika", "photos"],

  lbHintDesktop: ["Strelice ← → · Esc zatvara", "Arrow keys ← → · Esc closes"],
  lbHintMobile: ["Prevucite lijevo ili desno", "Swipe left or right"],
  lbLockedNote: ["Sve slike su u pregledu sa vodenim žigom.", "Every photo is a watermarked preview."],

  buyTitle: ["Otključaj galeriju", "Unlock gallery"],
  buyPriceLabel: ["Cijena paketa", "Package price"],
  buyItem1: ["Sve fotografije vaše grupe", "Every photo of your group"],
  buyItem2: ["Originalna rezolucija, bez vodenog žiga", "Original resolution, no watermark"],
  buyItem3: [
    "Dva formata za skidanje: za telefon i puna rezolucija",
    "Two download formats: phone size and full resolution",
  ],
  buyItem4: ["Link ostaje aktivan 30 dana", "The link stays active for 30 days"],
  buyFoot: ["Bez registracije · kod je vaša potvrda", "No account needed · your code is the receipt"],

  payLabel: ["Način plaćanja", "Payment method"],
  payCash: ["Gotovinom na bazi", "Cash at the base"],
  payCashBody: [
    "Platite operateru na bazi — otključava galeriju odmah, dok ste tu.",
    "Pay the operator at the base — they unlock the gallery right away, while you wait.",
  ],
  payCard: ["Kartica", "Card"],
  payCardBody: [
    "U pripremi — plaćanje karticom uskoro, na ovom istom mjestu.",
    "Coming soon — card payment will appear right here.",
  ],

  cashStepsTitle: ["Kako do otključavanja", "How to unlock"],
  cashStep1: [
    "Pokažite operateru ovaj ekran sa kodom svoje grupe.",
    "Show the operator this screen with your group code.",
  ],
  cashStep2: ["Platite iznos u gotovini.", "Pay the amount in cash."],
  cashStep3: [
    "Galerija se otključava sama, na svim telefonima koji imaju vaš kod.",
    "The gallery unlocks by itself, on every phone that has your code.",
  ],
  waitingForOperator: ["Čekam operatera…", "Waiting for the operator…"],
  waitingHint: [
    "Ostavite ovu stranicu otvorenu. Otključava se sama čim operater naplati.",
    "Leave this page open. It unlocks itself the moment the operator takes payment.",
  ],
  yourCode: ["Kod vaše grupe", "Your group code"],

  unlockCodeLabel: ["Unlock kod", "Unlock code"],
  unlockCodeHint: [
    "Ako operater nema signal, dobićete unlock kod da ga ukucate ovdje.",
    "If the operator has no signal they will give you an unlock code to type here.",
  ],
  unlockCodeCta: ["Otključaj", "Unlock"],
  unlockedToast: ["Galerija je otključana.", "The gallery is unlocked."],

  errNotFound: ["Kod nije prepoznat. Provjerite karticu.", "Code not recognised. Check the card."],
  // Alfabet kodova nema I, O, 0 ni 1 — na mokroj kartici se prelako zamijene.
  // Poruka mora da imenuje bas to, inace covjek gleda ispravan kod i ne zna sta fali.
  errMalformed: [
    "Kod ima osam znakova i ne sadrži I, O, 0 ni 1. Provjerite karticu.",
    "Codes are eight characters and never contain I, O, 0 or 1. Check the card.",
  ],
  errRateLimited: [
    "Previše pokušaja. Sačekajte 15 minuta ili nas pozovite.",
    "Too many attempts. Wait 15 minutes or give us a call.",
  ],
  errNoAttempts: ["Nema više pokušaja — pozovite studio", "No attempts left — call the studio"],
  errNetwork: ["Nema veze sa serverom.", "No connection to the server."],

  expiredKicker: ["Kod istekao", "Code expired"],
  expiredTitle: ["Galerija je arhivirana", "Gallery archived"],
  expiredBody: [
    "Fotografije sa ovog spusta su bile dostupne 30 dana i sada su u arhivi. Pozovite nas sa kodom sa kartice i vraćamo ih na dan.",
    "Photos from this descent were available for 30 days and are now archived. Call us with the code from your card and we will restore them within a day.",
  ],
  archivedKicker: ["Arhivirano", "Archived"],
  archivedTitle: ["Galerija je sklonjena", "Gallery taken down"],
  archivedBody: [
    "Ova galerija je sklonjena iz ponude. Pozovite nas sa kodom sa kartice.",
    "This gallery has been taken down. Call us with the code from your card.",
  ],
  callUs: ["Pozovi studio", "Call the studio"],

  emptyTitle: ["Termin bez slika", "No photos yet"],
  emptyBody: [
    "Za ovaj čamac još nema objavljenih fotografija. Provjerite ponovo večeras ili nas pozovite.",
    "Nothing published for this raft yet. Check again tonight or give us a call.",
  ],

  netTitle: ["Veza je prekinuta. Učitavanje je zaustavljeno.", "Connection lost. Loading has stopped."],
  retry: ["Pokušaj ponovo", "Try again"],

  downloadTitle: ["Skidanje", "Download"],
  unlockedTag: ["otključano · link aktivan 30 dana", "unlocked · link active 30 days"],
  zipWeb: ["Za telefon i mreže", "For phone and social"],
  zipWebMeta: ["2048 px · ~150 MB", "2048 px · ~150 MB"],
  zipFull: ["Puna rezolucija", "Full resolution"],
  zipFullMeta: ["~2,4 GB · traje dugo", "~2.4 GB · takes a while"],
  zipTitle: ["Pravimo vaš ZIP", "Building your ZIP"],
  zipBody: [
    "Možete zatvoriti stranicu. Kad paket bude gotov, link za skidanje stiže na mejl i ostaje aktivan 30 dana.",
    "You can close this page. When the package is ready the download link arrives by email and stays active for 30 days.",
  ],
  zipMailLabel: ["Mejl za link", "Email for the link"],
  zipSave: ["Sačuvaj mejl", "Save email"],
  zipMailBad: ["Unesite ispravnu mejl adresu.", "Enter a valid email address."],
  zipMock: [
    "Mock: u ovom prolazu se ZIP ne pravi zaista.",
    "Mock: no ZIP is actually built in this pass.",
  ],
  close: ["Zatvori", "Close"],

  feedTitle: ["Danas objavljeno", "Published today"],
  feedLive: ["u toku", "live"],
  feedFoot: ["Slike objavljujemo isto veče, obično do 22:00.", "Photos go up the same evening, usually by 22:00."],
  newPhotos: ["novih slika", "new photos"],

  loading: ["Učitavam…", "Loading…"],

  /* --- javni sajt: meni -------------------------------------------------- */
  navHome: ["Naslovna", "Home"],
  navRafting: ["Rafting", "Rafting"],
  navWeddings: ["Venčanja", "Weddings"],
  navBaptisms: ["Krštenja", "Baptisms"],
  navBirthdays: ["Rođendani", "Birthdays"],
  navAbout: ["O nama", "About"],
  navMenu: ["Meni", "Menu"],
  navClose: ["Zatvori meni", "Close menu"],
  navTagline: ["Fotografija Tara & Drina", "Photography Tara & Drina"],

  /* --- naslovna: hero ---------------------------------------------------- */
  heroKicker: ["Danas objavljeno", "Published today"],
  heroPlace: ["Tara, brzak Pesak", "Tara, Pesak rapid"],
  heroTitleA: ["Vaš čamac je", "Your raft is"],
  heroTitleB: ["već u galeriji", "already in the gallery"],
  heroCodeLabel: ["Ukucaj kod svoje grupe", "Enter your group code"],
  heroNote: [
    "Kod grupe dobijaš od vodiča poslije spusta — galerija stoji online do kraja sezone.",
    "Your guide hands out the group code after the descent — the gallery stays online until the end of the season.",
  ],
  heroFull: ["Cijeli ekran za unos", "Full code screen"],

  /* --- naslovna: rafting -------------------------------------------------- */
  raftSeason: ["Sezona april — oktobar", "Season April — October"],
  raftTitleA: ["Fotografije", "Photos"],
  raftTitleB: ["sa raftinga", "from the river"],
  raftBody: [
    "Stojimo na brzacima kroz koje prolazite — Pesak, Ušće, Bijeli kamen. Snimamo svaki čamac u prolazu, bez zaustavljanja spusta, i galeriju vežemo za broj vašeg čamca.",
    "We stand at the rapids you run — Pesak, Ušće, Bijeli kamen. Every raft gets shot on the way past, without stopping the descent, and the gallery is tied to your raft number.",
  ],
  raftStrip: ["Četiri kadra, okačena da se suše", "Four frames, hung out to dry"],
  raftShot1: ["01 — brzak Pesak", "01 — Pesak rapid"],
  raftShot2: ["02 — vesla i voda", "02 — paddles and water"],
  raftShot3: ["03 — kanjon, širi kadar", "03 — canyon, wide"],
  raftShot4: ["04 — grupa poslije spusta", "04 — the group after"],
  raftFact1: ["Više od 600 spustova", "More than 600 descents"],
  raftFact2: ["Galerija u roku od 72h", "Gallery within 72h"],
  raftFact3: ["Fotografije po broju čamca", "Photos by raft number"],
  raftCta: ["Cijela rafting galerija", "The whole rafting gallery"],

  /* --- naslovna: kontakt --------------------------------------------------- */
  ctcReply: ["Odgovaramo u toku dana", "We answer the same day"],
  ctcTitleA: ["Zakaži", "Book"],
  ctcTitleB: ["termin", "a date"],
  ctcBody: [
    "Napišite datum i mjesto, a mi vraćamo slobodne termine i cijenu istog dana. Za rafting je dovoljno da nam kažete agenciju i vrijeme spusta.",
    "Send us a date and a place and we come back with free slots and a price the same day. For rafting, the agency and the time of your descent is enough.",
  ],
  ctcPhone: ["Telefon", "Phone"],
  ctcMail: ["Mail", "Mail"],
  ctcInstagram: ["Instagram", "Instagram"],
  ctcStudio: ["Studio", "Studio"],
  ctcName: ["Ime i prezime", "Full name"],
  ctcNamePh: ["Marko Marković", "Marko Marković"],
  ctcContact: ["Telefon ili mail", "Phone or mail"],
  ctcContactPh: ["060 000 000", "060 000 000"],
  ctcKind: ["Tip snimanja", "Type of shoot"],
  ctcKindWedding: ["Venčanje", "Wedding"],
  ctcKindBaptism: ["Krštenje", "Baptism"],
  ctcKindBirthday: ["Rođendan", "Birthday"],
  ctcDate: ["Datum", "Date"],
  ctcPlace: ["Mjesto", "Place"],
  ctcPlacePh: ["Tara, Perućac…", "Tara, Perućac…"],
  ctcMessage: ["Poruka", "Message"],
  ctcMessagePh: [
    "Koliko ljudi, koliko sati, posebne želje…",
    "How many people, how many hours, anything special…",
  ],
  ctcNote: ["Odgovor u roku od 24h", "Answer within 24h"],
  ctcSend: ["Pošalji upit", "Send enquiry"],
  ctcSent: [
    "Upit poslat — javljamo se na kontakt koji ste ostavili.",
    "Enquiry sent — we will reach you on the contact you left.",
  ],
  ctcMissing: ["Ostavite ime i kontakt.", "Leave a name and a contact."],
  ctcMock: [
    "Mock: u ovom prolazu se upit ne šalje zaista.",
    "Mock: no enquiry is actually sent in this pass.",
  ],

  /* --- naslovna: footer ---------------------------------------------------- */
  ftSince: ["SM Foto Studio · od 2011", "SM Foto Studio · since 2011"],
  ftBlurb: [
    "Fotografija iz Foče, na Tari i Drini. Rafting spustovi, venčanja, krštenja i rođendani.",
    "Photography out of Foča, on the Tara and the Drina. Rafting descents, weddings, baptisms and birthdays.",
  ],
  ftGalleries: ["Galerije", "Galleries"],
  ftStudio: ["Studio", "Studio"],
  ftBook: ["Zakaži termin", "Book a date"],
  ftSeat: ["Foča", "Foča"],
  ftSeason: ["Sezona: april — oktobar", "Season: April — October"],
  ftContact: ["Kontakt", "Contact"],
  ftHours: ["Pon — sub, 9—20h", "Mon — Sat, 9—20h"],
  ftRights: ["© 2026 SM Foto Studio", "© 2026 SM Foto Studio"],
  ftCopyright: ["Sve fotografije zaštićene autorskim pravom", "All photographs are copyrighted"],
  ftTop: ["Nazad na vrh", "Back to top"],

  /* --- galerija po kategoriji ----------------------------------------------- */
  catKicker: ["Galerija", "Gallery"],
  catRaftingDesc: [
    "Spustovi Tarom i Drinom. Svaki čamac dobija svoju galeriju istog dana, fotografije poređane po broju čamca.",
    "Descents down the Tara and the Drina. Every raft gets its gallery the same day, photos ordered by raft number.",
  ],
  catWeddingsDesc: [
    "Cijeli dan, od priprema do zadnjeg plesa. Snimamo u crkvi, na rijeci i u sali, bez postavljanja i ponavljanja kadrova.",
    "The whole day, from getting ready to the last dance. In the church, on the river and in the hall, nothing staged and nothing repeated.",
  ],
  catBaptismsDesc: [
    "Obred i porodično okupljanje poslije njega. Tiho snimanje, uz dogovor sa crkvom oko mjesta i svjetla.",
    "The rite and the family gathering after it. Quiet shooting, agreed with the church on place and light.",
  ],
  catBirthdaysDesc: [
    "Dječji i porodični rođendani, u sali ili na otvorenom. Reportaža kroz cijeli dan, torta i gosti uključeni.",
    "Children and family birthdays, indoors or out. Reportage through the whole day, cake and guests included.",
  ],
  catRaftingMeta: ["sezona 2026", "season 2026"],
  catWeddingsMeta: ["2024 — 2026", "2024 — 2026"],
  catYearRound: ["cijele godine", "year round"],
  catPhotos: ["fotografija", "photographs"],
  catPlaceholder: [
    "Maketa — prave slike iz ove kategorije još nisu povezane.",
    "Mockup — real photos for this category are not wired up yet.",
  ],
  catRaftingCta: ["Imate kod grupe?", "Got a group code?"],

  /* --- o nama --------------------------------------------------------------- */
  abKicker: ["O nama", "About"],
  abSince: ["Studio od 2022 · Foča", "Studio since 2022 · Foča"],
  abNameA: ["Sreten", "Sreten"],
  abNameB: ["Milutinović", "Milutinović"],
  abBody1: [
    "Studio je počeo 2022. godine u Foči. Snimam sam — spustove na rijeci, venčanja, krštenja i rođendane, u gradu i van njega.",
    "The studio started in 2022 in Foča. I shoot alone — descents on the river, weddings, baptisms and birthdays, in town and out of it.",
  ],
  abBody2: [
    "Slike dobijate isti dan. To je jedino što obećavam unaprijed i jedino od čega ne odustajem: kad se dan završi, galerija je vaša.",
    "You get the photos the same day. That is the only thing I promise up front and the one thing I never drop: when the day ends, the gallery is yours.",
  ],
  abPhotographer: ["Fotograf", "Photographer"],
  abSeat: ["Sjedište", "Based in"],
  abPricing: ["Cjenovnik", "Pricing"],
  abOnRequest: ["Na zahtjev", "On request"],
  abPortrait: ["portret — na terenu", "portrait — on location"],
  abSameDay: [
    "Slike isti dan · rad na terenu i u studiju",
    "Photos the same day · on location and in studio",
  ],
} satisfies Record<string, Entry>;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang === "en" ? 1 : 0];
}

/** "Još 2 pokušaja" — broj menja oblik rijeci. */
export function attemptsPhrase(lang: Lang, n: number): string {
  if (n <= 0) return t(lang, "errNoAttempts");
  if (lang === "en") return `${n} attempt${n === 1 ? "" : "s"} left`;
  const last = n % 10;
  const teens = n % 100 >= 11 && n % 100 <= 14;
  return `Još ${n} ${!teens && last === 1 ? "pokušaj" : "pokušaja"}`;
}

export function formatPrice(minor: number, currency: string): string {
  const major = minor / 100;
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2).replace(".", ",");
  return `${text} ${currency === "BAM" ? "KM" : currency}`;
}

/** 17.08.2026 — format sa kartice i iz dizajna. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const WEEKDAYS: Record<Lang, string[]> = {
  bs: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function weekday(iso: string, lang: Lang): string {
  return WEEKDAYS[lang][new Date(iso).getDay()]!;
}
