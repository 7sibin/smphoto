# Ingest slika — radna bilješka

**Datum:** 8. septembar 2026.
**Status:** NEZAVRŠENO. Brainstorming je stao na pitanju o razvrstavanju po
čamcima; korisnik još nije odgovorio. Nema odobrenog dizajna, ništa se ne gradi.

Klasifikacija: **arhitektonska** — nov podsistem, mijenja `bake.ts`,
`derivatives.ts`, media rute i vjerovatno model podataka.

---

## Problem

Sezona ima ~200.000 fotografija, ~2.000 dnevno. Galerija ima 300-500.
Trenutni `scripts/bake.ts` peče **svih 8 derivata za svaku sliku pri unosu** i
piše na lokalni disk. To ne radi na ovoj skali, a ni na Vercelu — fajl sistem
funkcija je read-only i efemeran, pa `storage/` u deploymentu ne postoji
(danas `readDerivative` vraća `null` i crta se mock).

## Šta je utvrđeno o okruženju

- **Fotograf uveče ubaci karticu u računar u kancelariji.** Nije na bazi, nije
  preko mobilnog. Veza je „običan internet" — tačna brzina uploada još nije
  utvrđena, računao sam sa 10 Mbps kao pesimističnim slučajem.
- Hosting je Vercel, baza Supabase Postgres. Vidi `CLAUDE.md`.

## Izmjereno

Kroz isti sharp lanac koji koristi `bake.ts` (`webp`, quality 72 za `wm`,
82 za `clean`), na četiri prave fotografije sa Tare iz `assets/photos`.

**Oprez:** uzorci su 1080×1080, pa su 400 i 800 stvarno izmjereni, a 1400 i
2048 su ekstrapolirani po broju piksela. Original od ~8 MB je **pretpostavka**
— treba izmjeriti na pravom fajlu iz fotografovog aparata prije nego što se
išta odluči na osnovu tog broja.

| širina | wm | clean |
|---|---|---|
| 400 | 35 KB *(mjereno)* | 46 KB *(mjereno)* |
| 800 | 100 KB *(mjereno)* | 137 KB *(mjereno)* |
| 1400 | ~230 KB *(procjena)* | ~300 KB *(procjena)* |
| 2048 | ~420 KB *(procjena)* | ~560 KB *(procjena)* |
| **svih 8** | | **~1,8 MB** |
| original | | **~8 MB** *(pretpostavka)* |

Širine su `ALLOWED_WIDTHS = [400, 800, 1400, 2048]` iz `src/lib/mockImage.ts:12`.

### Za sezonu od 200.000 slika

- Originali: **~1,6 TB** — 82% svega
- Svi derivati kako se danas peku: **~366 GB**
- Samo ono što galerija prikazuje (`wm` 400+800+1400): **~73 GB**

Original je najveći dio, a galerija ga nikad ne dodirne.

---

## Prijedlog: tri sloja po tome kada su potrebni

Potekao iz zapažanja korisnika — galeriji ne trebaju originali da bi bila živa,
trebaju joj thumb i preview; original je potreban tek za ZIP poslije naplate.

**Topli — peče se svima, odmah.**
Samo `wm` na 400/800/1400. 365 KB po slici, 73 GB za sezonu. Jedino što
galerija servira dok grupa ne plati.

**Mlaki — peče se tek kad grupa plati.**
Čisti derivati, za tu jednu galeriju, na operaterov klik „Naplaćeno".
300-500 slika, par minuta u pozadini dok grupa još gleda.

**Hladni — original, arhiva.**
Ne dira se dok neko ne traži ZIP u punoj rezoluciji.

### Odstupanje od CLAUDE.md koje treba svjesno donijeti

`CLAUDE.md` kaže: *„Derivati se peku pri ingest-u, ne on-the-fly."*
Pečenje čistih derivata pri otključavanju nije on-the-fly u opasnom smislu —
ruta koja servira bajtove i dalje nikad ne obrađuje sliku, peče se na jedan
operaterov klik, ne na zahtjev pregledača. Ali jeste izmjena pravila.
**Ne provlačiti prećutno; tražiti izričitu odluku.**

---

## Nalaz: originali ne moraju da idu gore

Ako fotograf peče derivate **lokalno, na računaru u kancelariji**, gore ide
samo ono što galerija prikazuje:

| | dnevno | na 10 Mbps |
|---|---|---|
| sve, sa originalima | 16 GB | 3,5 sata |
| samo `wm` derivati | **730 MB** | **10 minuta** |

Dvadeset dva puta manje uploada.

Originali ostaju na disku u kancelariji. Kad grupa plati, tek tada se za tu
galeriju šalje ono što treba za ZIP (~400 slika, ~3,2 GB, oko pola sata u
pozadini). Grupa ionako dobija link kad ZIP bude spreman, ne istog trenutka.

**Cijena te odluke:**

- Originali su na jednom mjestu. Ako disk crkne, sezona je otišla.
  Traži rezervnu kopiju — vanjski disk ili spora noćna sinhronizacija.
- Računar u kancelariji postaje dio sistema. Ne mora biti stalno upaljen, ali
  mora da se upali kad neko plati.

**Alternativa:** originali idu gore u pozadini preko noći, sve je na jednom
mjestu, računar više nije potreban — ali si na 16 GB dnevno. To je izbor koji
ide korisniku kad se budu birale opcije.

---

## Storage: preporuka ide ka Cloudflare R2

Razlog nije cijena memorije nego **besplatan egress**. Skidanje je ovdje veliko:
jedna plaćena grupa povuče ~3,2 GB. Na S3 bi izlazni saobraćaj sezone bio
skuplji od svega ostalog; na R2 je nula. ~1,6 TB je oko 24 $ mjesečno.

Nije još razrađeno u opcije sa alternativama (B2, S3 + Glacier). To dolazi
poslije odgovora na otvorena pitanja.

---

## Otvorena pitanja

**1. Kako slika zna kojem čamcu pripada?** *(postavljeno, čeka odgovor)*

Kartica ima 2.000 slika iz dana, dan je 10-15 čamaca. Model već ima `takenAt`
na slici i `startsAt`/`endsAt` na terminu, pa bi razvrstavanje moglo ići samo
po vremenu snimanja — ako je sat u aparatu tačan i ako se termini ne preklapaju.

Ponuđeno korisniku:
1. Sat je tačan, čamci idu jedan po jedan → automatsko razvrstavanje radi
2. Termini se preklapaju (dva čamca, više fotografa) → treba još nešto
3. Fotograf ionako ručno prebira u foldere → program kupi gotove foldere
4. Ne zna se još, treba pitati fotografa

**2. Kolika je stvarno brzina uploada u kancelariji?**
Računao sam sa 10 Mbps. Razlika 10 → 50 Mbps mijenja da li je noćna
sinhronizacija originala uopšte opcija.

**3. Koliki procenat grupa plati?**
Ako plaćaju skoro sve, odloženo pečenje čistih derivata ne štedi ništa i
komplikuje bez razloga. Ako plaća trećina, štedi dvije trećine posla i memorije.

**4. Koliko je stvarno velik original iz aparata?**
Cijela računica originala visi na pretpostavci od 8 MB. Treba jedan pravi fajl.

**5. Da li se originali čuvaju zauvijek?**
`Session` već ima `expiresAt` i `archivedAt`. Ako se originali brišu poslije
sezone, 1,6 TB je gornja granica jedne sezone, ne kumulativno.

---

## Gdje je relevantan kod

```
scripts/bake.ts              današnji ingest — peče svih 8, piše na lokalni disk
src/lib/mockImage.ts:12      ALLOWED_WIDTHS = [400, 800, 1400, 2048]
src/lib/derivatives.ts       čitanje derivata; STORAGE_ROOT, readDerivative
src/lib/mediaGuard.ts        jedina kapija do bajtova slike
prisma/schema.prisma         Photo.storageKey, hasDerivatives, bytes, takenAt
```

## Sljedeći korak kad se nastavi

Odgovor na pitanje 1, pa ostala pitanja, pa 2-3 opcije sa kompromisima i
preporukom, pa dizajn po sekcijama uz odobrenje, pa tek onda plan
implementacije. Ništa se ne gradi prije odobrenja.
