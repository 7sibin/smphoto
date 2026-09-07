# Rafting Gallery — pass 1: frontend + API sa mock podacima

Bez CDN-a. Mock slike crta server u SVG, u letu; prave fotografije se peku pri
ingestu i sluze se sa diska, kao sto bi ih sluzio CDN.

## Pokretanje

```bash
npm install
npm run demo     # seed + bake: 12 sesija, 2962 slike, 4 prave u Camcu 3
npm run dev
```

`npm run demo` je `npm run seed && npm run bake`. Idu zajedno: seed pravi nove
UUID-eve slika, a bake pece derivate bas za te ID-eve. Sam seed ostavlja
galeriju bez pravih slika.

Seed na kraju ispisuje tabelu svih kodova. Sesija koja je test slučaj:

| | |
|---|---|
| **420 slika** | http://localhost:3000/g/K7XM4Q2P |
| kod sa kartice | `K7XM4Q2P` |
| rezervni unlock kod | `9RTUNL42` |
| admin panel | http://localhost:3000/admin (token: `ADMIN_TOKEN` iz `.env`) |

`/g/K7XM4Q2P` je QR deep link — popuni kod i sam ga pošalje.
Isti kod možeš ukucati u hero na naslovnoj `/` ili na punom ekranu `/kod`.

## Rute

Javni sajt (iz `sm-foto-studio-web-design/`):

| ruta | ekran |
|---|---|
| `/` | naslovna — hero sa unosom koda, rafting, zakaži termin, footer |
| `/galerija/rafting` | izlog kategorije |
| `/galerija/vencanja`, `/krstenja`, `/rodjendani` | izlog, plocice su maketa |
| `/o-nama` | studio i kontakt |

Tok sa kodom:

| ruta | ekran |
|---|---|
| `/kod` | puni unos koda — feed, brojač pokušaja, 410 ekrani |
| `/g/[kod]` | QR deep link |
| `/dani` | pregled po datumu |
| `/s/[id]` | galerija grupe |
| `/admin` | naplata |

Meni je jedan za cio sajt (`SiteNav`). Na ekranima toka sa kodom nosi i broj
telefona i potpis „Preuzmi svoje fotografije"; ispod 900px linkovi idu u fioku.

Prave slike stoje samo iza rafting koda. Tri ostale kategorije su izlog —
plocice se crtaju iz tonova, kao u prototipu, jer sadržaj nije povezan.
Forma „Zakaži termin" nema rutu koja je prima; potvrđuje unos i to je sve.

### Da vidiš prelaz zaključano → otključano

1. Otvori `/g/K7XM4Q2P` — galerija je pod vodenim žigom.
2. U drugom tabu otvori `/admin`, upiši `ADMIN_TOKEN` iz `.env` i ID operatera,
   nađi „Čamac 3 · 14:20" i klikni **Naplaćeno**.
3. Vrati se na galeriju. U roku od par sekundi se sama otključa —
   žig nestaje, donja traka postaje tamna sa dvije opcije za skidanje.

Rezervni put bez admina: u galeriji otvori „Otključaj galeriju" →
„Unlock kod" → ukucaj `9RTUNL42`.

### Ostali kodovi za ekrane

Puna tabela ide iz `npm run seed`. Zanimljivi slučajevi:

| kod | ekran |
|---|---|
| `HBJXFLBF` | prazan termin — 0 slika |
| `HG92TVZD` | već otključana galerija |
| `6PL53R8K` | istekao kod — 410 `expired` |
| `H3DYPTJU` | arhivirana galerija — 410 `archived` |
| bilo šta pogrešno | brojač pokušaja, pa 429 poslije 10 |

Prekid mreže: ugasi mrežu u DevTools dok galerija stoji otvorena.

## Prave fotografije

Prve četiri slike u galeriji Čamca 3 su stvarne fotografije sa Tare. Ostalih
416 su sintetički kadrovi. Dovoljno da se na demou vidi kako izgleda proizvod,
bez 420 pravih fajlova u repou.

### Kako dodati svoje

```bash
cp ~/spust/*.jpg assets/photos/     # privatni izvor, van public/
npm run bake                        # ili: npm run bake K7XM4Q2P 12
```

`bake` uzima slike po abecedi i vezuje ih za **prve** slike sesije po vremenu
snimanja, pa se vide odmah, bez skrolovanja. Prima kod galerije i broj slika kao
argumente.

### Šta se dešava pri pečenju

Za svaku sliku, za svaku od četiri dozvoljene širine, peku se **dva** fajla:

```
storage/originals/<sessionId>/<photoId>.webp     original, nikad se ne servira
storage/derivatives/wm/<photoId>@<w>.webp        žig rasterizovan u piksele
storage/derivatives/clean/<photoId>@<w>.webp     čista slika
```

Dva direktorijuma su ono što će sutra biti dvije CDN zone. Varijanta u putanji
dolazi iz literala u ruti, nikad iz zahtjeva.

**Žig je u pikselima.** U `wm` fajlu ne postoji nijedan piksel čiste
fotografije — nema sloja koji se ugasi, nema elementa koji se obriše. To je
razlika između ovoga i bilo kakvog overlay pristupa.

**EXIF otpada.** `sharp` po difoltu ne prenosi metapodatke u izlaz, pa GPS
koordinate kanjona i serijski broj aparata ne izlaze iz storage-a.

**Ništa se ne obrađuje po zahtjevu.** `sharp` se uvozi samo u `scripts/bake.ts`
i nikad ne ulazi u server bundle. Ruta radi jedan `readFile` i šalje bajtove.

### Uklonjen `MOCK_PHOTO_SOURCE=picsum`

Taj put je povlačio fotografiju sa mreže, ubacivao je kao base64 `<image>` u
SVG, i preko nje crtao žig kao SVG tekst. README je tvrdio da „i dalje peče žig
na serveru" — nije, to je bio overlay. Čista fotografija je putovala do klijenta
u **svakom wm odgovoru**; bilo je dovoljno snimiti SVG i obrisati jedan `<g>`.
Zamijenjeno pečenjem iznad.

## Provjera

```bash
npm run smoke    # 46 provjera protiv pokrenutog dev servera
npx tsc --noEmit
npm run build
```

`npm run smoke` traži svjež seed (dio testova otključava sesije), a poslije
sebe ostavlja otključane galerije. Redoslijed je uvijek **smoke, pa
`npm run demo`** — ne obrnuto.
Svaki run koristi svoju laznu IP u `X-Forwarded-For`, pa rate limit ne curi
iz jednog run-a u drugi.

## Stack

Next.js 15 (App Router) · Prisma + SQLite · bez runtime zavisnosti van toga.
Prelaz na Postgres je promjena `provider` i `DATABASE_URL` — schema ostaje.

## Kako je riješeno nepregovaračko

**Nivo pristupa određuje isključivo server.** `POST /api/access` izdaje token
skopiran na nivo koji sesija stvarno ima u tom trenutku. Token nosi prefiks
putanje (`pathAllowed`), pa `wm` token ne otvara `clean` rutu ni za jednu
sliku. `/api/media/clean/...` uz to **ponovo čita `sessions.unlocked_at` iz
baze na svaki zahtjev** — token izdat prije naplate ne vrijedi poslije.

**Dvije odvojene zone.** `src/app/api/media/wm/` i `.../clean/` su dva fajla,
varijanta je u svakom zakucana kao literal. Ne postoji parametar kojim bi
klijent pomjerio `wm` zahtjev u `clean` odgovor.

**Žig je u bajtovima, ne u CSS-u.** Da je overlay, čista slika bi već putovala
do klijenta i bilo bi dovoljno ugasiti jedan div.

**Jedan token po sesiji.** 420 slika se učita sa jednim HMAC-om, ne sa 420.

**Kodovi su HMAC-SHA256** sa serverskim ključem. Kolona je `UNIQUE`, pa je
lookup jedan indeksirani upit. Plaintext ne postoji nigdje.

**Nikad cijela galerija u jednom JSON-u.** Kursor je `(taken_at, id)` — samo
`taken_at` nije jedinstven, pa bi se slike na granici strane gubile ili
ponavljale. 60 po strani, 7 strana za 420.

**Grid je virtualizovan.** Visina se zna od prve sekunde iz `photoCount`, prije
nego što ijedna slika stigne — nema reflow-a. Renderuju se samo redovi u
prozoru ±2. Skok na dno lančano povlači strane dok ne stigne dotle.

**Rate limit** 10 / 15 min po IP, na oba tipa koda, provjerava se **prije**
lookupa — inače je baza besplatan orakl.

**Svako otključavanje se loguje** i upisuje red u `orders`, u istoj
transakciji. Naplata je van softvera, pa je audit trag jedina kontrola.

## Tri odluke koje odstupaju od prototipa

1. **Nema „Potvrdi i otključaj" dugmeta.** U prototipu ga korisnik sam klikne
   i galerija se otključa. To bi značilo da klijent mijenja nivo pristupa.
   Panel je sada cijena + uputstvo za gotovinu + kod grupe koji se pokazuje
   operateru, a galerija se otključava kroz polling na
   `/api/sessions/:id/status`. Rezervni put je unlock kod.

2. **„Pregled po datumu" ne otvara slike.** Prototip kaže „kod nije potreban
   za pregled". `CLAUDE.md` kaže da je kod jedina autentikacija i da galerija
   ne smije biti enumerabilna. Spisak dana i termina jeste javan (dan, čamac,
   broj slika — nijedan photo id), ali klik vodi na unos koda.

3. **Mobile-first, izvedeno.** U bundle-u je samo desktop artboard. Raspored
   ispod 900px je izveden iz istog vizuelnog jezika: jedna kolona, grid 2
   kolone na 375px, donja traka sticky, lightbox sa swipe-om, sve mete ≥48px.
   Desktop prati fajl.

## Šta je mock i mora da padne u sledećem prolazu

- **Većinu slika crta server u SVG** (`src/lib/mockImage.ts`), deterministično
  po `photo.id`. To je jedini dio slikovnog toka koji je još mock. Prave
  fotografije u galeriji **nisu** mock — one idu putem koji ostaje: pečene pri
  ingestu, servirane sa diska. Kad dođe CDN, mijenja se samo odakle
  `readDerivative` čita bajtove; `serveDerivative` ostaje kao kapija.
- **ZIP se ne pravi.** Progres je tajmer, mejl se nigdje ne šalje. Piše u panelu.
- **Admin je zaštićen dijeljenim `ADMIN_TOKEN`-om** iz `.env`. Nema naloga
  operatera — to dolazi kad se admin bude gradio.
- **`expires_at` / `archived_at`** nisu bili u zadatom modelu, ali bez njih
  `/api/access` nema odakle da vrati 410 `expired` / `archived`.

## Mapa

```
prisma/schema.prisma        events, sessions, photos, orders, code_attempts
prisma/seed.ts              3 događaja, 12 sesija, jedna sa 420 slika

src/lib/codes.ts            HMAC kodova (samo server)
src/lib/codeFormat.ts       dužina i alfabet — dijele server i klijent
src/lib/token.ts            potpis, TTL, pathAllowed
src/lib/mediaGuard.ts       jedina kapija do bajtova slike
src/lib/mockImage.ts        SVG derivati za mock slike, žig u bajtovima
src/lib/derivatives.ts      čitanje pečenih derivata sa diska
scripts/bake.ts             ingest: prave fotografije, žig rasterizovan
src/lib/ratelimit.ts        10 / 15 min po IP
src/lib/client.ts           fetch sloj + grant u sessionStorage

src/app/api/access                        oba tipa koda, 401/410/429
src/app/api/sessions/[id]/photos          kursor po (taken_at, id)
src/app/api/sessions/[id]/status          polling za otključavanje
src/app/api/media/wm|clean/…              dvije odvojene zone
src/app/api/admin/sessions/[id]/unlock    order + unlocked_at + unlocked_by

src/components/CodeScreen     unos koda, QR deep link, greške sa brojačem
src/components/DatesScreen    pregled po datumu
src/components/Gallery        orkestracija: paginacija, polling, trake
src/components/PhotoGrid      virtualizacija
src/components/Lightbox       swipe, brojač, tastatura
src/components/UnlockPanel    cijena, gotovina, unlock kod
src/components/AdminPanel     operaterov „Naplaćeno"
```
