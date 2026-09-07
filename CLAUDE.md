# Rafting Gallery

Sajt gde grupa sa raftinga ukuca kod sa kartice i vidi svoje slike.
Plaćanje je isključivo gotovinom na licu mesta.

## Kako radi pristup — dva nivoa

1. **Kod sa kartice** — deli se besplatno svakoj grupi na kraju spusta.
   Otvara galeriju sa watermarkom.
2. **Otključavanje** — operater naplati gotovinu i klikne "Naplaćeno"
   u adminu. Galerija postaje čista za svakog ko ima kod te grupe.
   Rezervni put: unlock kod, ako operater nema signal.

Nema korisničkih naloga. Kod je jedina autentikacija.
Prodaje se cela galerija grupe kao jedan paket.

## Nepregovaračko — bezbednost

- Original nikad nema javnu putanju. Samo potpisan URL sa kratkim TTL,
  i to tek nakon što server proveri `sessions.unlocked_at`.
- Watermarkovani i čisti derivati su odvojene CDN zone. Ne sme postojati
  code path koji servira čistu sliku kroz watermark rutu.
- Nivo pristupa određuje ISKLJUČIVO server. Klijent ne sme da dobije
  čiste slike menjanjem nečega u zahtevu ili u state-u.
- Kodovi se čuvaju kao HMAC-SHA256 sa serverskim ključem, nikad plaintext.
  HMAC je deterministički pa se indeksira i pretražuje direktno.
- Imena fajlova su UUID. Galerija ne sme biti enumerabilna.
- EXIF se strippuje sa svih derivata.
- Rate limit: 10 pokušaja / 15 min po IP, na oba tipa koda.
- Svako otključavanje se loguje sa operator_id i vremenom. Naplata je
  van softvera, pa je audit trag jedina kontrola.

## Nepregovaračko — performanse

Sezona ima ~200.000 slika. Jedna galerija ima 300-500.
Svako rešenje mora da radi na tom broju, ne na 12.

- Nikad cela galerija u jednom JSON-u. Cursor paginacija po `taken_at`,
  60 po strani.
- Jedan potpisan token po sesiji, skopiran na putanju (pathAllowed).
  NIKAD token po slici — 400 HMAC-ova po učitavanju stranice je bug.
- Grid mora biti virtualizovan, sa fiksnim aspect ratio placeholderima
  da nema reflow-a tokom učitavanja.
- Derivati se peku pri ingest-u, ne on-the-fly. CDN samo servira bajtove.

## Kontekst korisnika

Mobile-first, počni od 375px. Ljudi su na parkingu, mokri, sunce na
ekranu, loš signal, jedna ruka. Dugmad minimum 48px. Bez modala koji
traže precizan tap.
Interfejs na bosanskom, prekidač za engleski.

## Šta NE gradimo

Korisničke naloge. Online plaćanje, PaymentProvider apstrakciju,
checkout flow, webhook rute. Per-photo prodaju. Face search.
Blokiranje desnog klika.

## Stack

- Framework: Next.js 15, App Router. API rute iz specifikacije mapiraju se
  1:1 na fajl-rutere.
- Baza: Prisma. SQLite lokalno; prelaz na Postgres je promjena `provider` i
  `DATABASE_URL`, schema ostaje ista.
- Hosting: [još nije odlučeno]

Vidi README.md za pokretanje i za spisak onoga što je u prvom prolazu mock.