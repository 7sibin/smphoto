"""
Smoke test za gallery flow. Pokrece se protiv `npm run dev`.

Svaki run koristi svoju laznu IP adresu u X-Forwarded-For, pa rate limit
jednog run-a ne truje sledeci. Za dio koji trazi zakljucanu sesiju
pokreni `npm run seed` prije testa.
"""

import json
import os
import random
import re
import sys
import urllib.error
import urllib.request

# Next bira sledeci slobodan port ako je 3000 zauzet, pa se baza da nadjacati.
B = os.environ.get("SMOKE_BASE", "http://localhost:3000")
IP = f"203.0.113.{random.randint(2, 250)}"
ADMIN = "dev-admin-token-promeni-u-produkciji"

ok = fail = 0


def req(method, path, body=None, headers=None, ip=IP):
    h = {"X-Forwarded-For": ip}
    h.update(headers or {})
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(B + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def js(b):
    try:
        return json.loads(b)
    except Exception:
        return {}


def check(name, cond, extra=""):
    global ok, fail
    if cond:
        ok += 1
        print(f"  OK   {name}")
    else:
        fail += 1
        print(f"  FAIL {name}   {extra}")


print("\n[1] javne liste (bez koda)")
s, b = req("GET", "/api/events")
ev = js(b)
check("GET /api/events -> 3 dana", s == 200 and len(ev.get("events", [])) == 3, f"{s}")
eid = ev["events"][0]["id"]
s, b = req("GET", f"/api/events/{eid}/sessions")
se = js(b)
check("GET /api/events/:id/sessions -> 200", s == 200 and len(se.get("sessions", [])) >= 4, f"{s}")
check("lista ne nosi photo id-eve", all("photos" not in x for x in se["sessions"]))
check("arhivirana sesija nije u listi", all(x["state"] != "archived" for x in se["sessions"]))

print("\n[2] access kodom sa kartice — sesija sa 420 slika")
s, b = req("POST", "/api/access", {"code": "K7XM4Q2P"})
a = js(b)
check("POST /api/access -> 200", s == 200, f"{s} {b[:200]}")
check("unlocked == false", a.get("unlocked") is False, a.get("unlocked"))
check("photoCount == 420", a["session"]["photoCount"] == 420, a["session"].get("photoCount"))
check("mediaBase je wm zona", a["mediaBase"].startswith("/api/media/wm/"), a.get("mediaBase"))
body_text = b.decode()
check("odgovor ne nosi hmac ni storage key",
      "Hmac" not in body_text and "storage" not in body_text.lower())
sid, wm_token = a["sessionId"], a["token"]
auth = {"Authorization": f"Bearer {wm_token}"}

print("\n[3] kursor paginacija po taken_at")
s, b = req("GET", f"/api/sessions/{sid}/photos?limit=60", headers=auth)
p1 = js(b)
check("prva strana -> 60", s == 200 and len(p1["photos"]) == 60, f"{s} {len(p1.get('photos', []))}")
check("nextCursor postoji", bool(p1.get("nextCursor")))
check("slika nosi samo id/w/h/takenAt",
      set(p1["photos"][0].keys()) == {"id", "w", "h", "takenAt"}, list(p1["photos"][0].keys()))

s, b = req("GET", f"/api/sessions/{sid}/photos?limit=60")
check("photos bez tokena -> 401", s == 401, s)

seen, cur, pages = [], None, 0
while pages < 12:
    q = f"/api/sessions/{sid}/photos?limit=60" + (f"&cursor={cur}" if cur else "")
    s, b = req("GET", q, headers=auth)
    d = js(b)
    pages += 1
    seen += [x["id"] for x in d["photos"]]
    cur = d.get("nextCursor")
    if not cur:
        break
check("sve strane daju 420", len(seen) == 420, len(seen))
check("bez duplikata na granicama strana", len(set(seen)) == 420, len(set(seen)))
check("7 strana po 60", pages == 7, pages)
takens = [x for x in seen]
check("redoslijed je stabilan", takens == seen)

print("\n[4] media zone — wm i clean su odvojene")
pid = p1["photos"][0]["id"]
s, b = req("GET", f"/api/media/wm/{sid}/{pid}?w=400&t={wm_token}")
check("wm ruta + wm token -> 200", s == 200, s)
# Galerija mijesa dvije vrste slika: mock kadrovi se crtaju u SVG, a prave
# fotografije su peceni WebP derivati sa zigom u pikselima. Tekst ziga se moze
# traziti samo u prvoj vrsti — u drugoj ga po definiciji nema kao tekst, i to
# je poenta. Da wm i clean nisu isti bajtovi provjerava se poslije naplate.
if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
    check("wm bajtovi su pecen webp derivat", len(b) > 2000, f"{len(b)}b")
else:
    check("wm bajtovi nose vodeni zig", b"SM FOTO STUDIO" in b)
wm_bytes = b

s, b = req("GET", f"/api/media/clean/{sid}/{pid}?w=400&t={wm_token}")
check("clean ruta + wm token -> odbijeno, 0 bajtova", s in (401, 403) and not b, f"{s} {len(b)}b")
s, b = req("GET", f"/api/media/wm/{sid}/{pid}?w=400")
check("wm ruta bez tokena -> odbijeno", s in (401, 403) and not b, s)
s, b = req("GET", f"/api/media/wm/{sid}/{pid}?w=400&t={wm_token}X")
check("izmijenjen potpis -> odbijeno", s in (401, 403) and not b, s)

s, b = req("POST", "/api/access", {"code": "NKHUHVBM"})
other = js(b)
s, b = req("GET", f"/api/media/wm/{sid}/{pid}?w=400&t={other['token']}")
check("token druge sesije -> odbijeno", s in (401, 403) and not b, f"{s} {len(b)}b")

print("\n[5] status prije naplate")
s, b = req("GET", f"/api/sessions/{sid}/status", headers=auth)
check("status -> unlocked false", s == 200 and js(b).get("unlocked") is False, f"{s} {b[:120]}")

print("\n[6] admin naplata upisuje order")
s, b = req("POST", f"/api/admin/sessions/{sid}/unlock", {"amount": 6000, "operatorId": "op-test"})
check("unlock bez admin tokena -> 401", s == 401, s)
s, b = req("POST", f"/api/admin/sessions/{sid}/unlock", {"operatorId": ""},
           {"Authorization": f"Bearer {ADMIN}"})
check("unlock bez operatorId -> 400", s == 400, s)
s, b = req("POST", f"/api/admin/sessions/{sid}/unlock", {"amount": 6000, "operatorId": "op-test"},
           {"Authorization": f"Bearer {ADMIN}"})
check("unlock -> 200 sa orderId", s == 200 and bool(js(b).get("orderId")), f"{s} {b[:150]}")
s, b = req("POST", f"/api/admin/sessions/{sid}/unlock", {"amount": 6000, "operatorId": "op-test"},
           {"Authorization": f"Bearer {ADMIN}"})
check("drugi klik ne pravi drugi order", s == 200 and js(b).get("alreadyUnlocked") is True, b[:150])

print("\n[7] status poslije naplate — prelaz na clean")
s, b = req("GET", f"/api/sessions/{sid}/status", headers=auth)
st = js(b)
check("status -> unlocked true", st.get("unlocked") is True, st)
check("status vraca nov token", bool(st.get("token")))
check("nov mediaBase je clean zona",
      st.get("mediaBase", "").startswith("/api/media/clean/"), st.get("mediaBase"))
clean_token = st["token"]

s, b = req("GET", f"/api/media/clean/{sid}/{pid}?w=400&t={clean_token}")
check("clean ruta + clean token -> 200", s == 200, s)
check("clean bajtovi nemaju vodeni zig", b"SM FOTO STUDIO" not in b)
check("clean i wm nisu isti bajtovi", b != wm_bytes)

s, b = req("GET", f"/api/media/clean/{sid}/{pid}?w=400&t={wm_token}")
check("stari wm token i dalje ne otvara clean", s in (401, 403) and not b, f"{s} {len(b)}b")
s, b = req("GET", f"/api/media/wm/{sid}/{pid}?w=400&t={clean_token}")
check("clean token ne radi na wm ruti", s in (401, 403) and not b, f"{s} {len(b)}b")

print("\n[8] unlock kod kao rezervni put")
s, b = req("POST", "/api/access", {"code": "EXC7S8FS"}, ip="203.0.113.251")
u = js(b)
check("unlock kod -> 200 i odmah unlocked", s == 200 and u.get("unlocked") is True, f"{s} {b[:150]}")
check("unlock kod daje clean mediaBase",
      u.get("mediaBase", "").startswith("/api/media/clean/"), u.get("mediaBase"))

print("\n[9] 410 stanja")
s, b = req("POST", "/api/access", {"code": "6PL53R8K"})
check("istekao -> 410 expired", s == 410 and js(b).get("reason") == "expired", f"{s} {b[:100]}")
s, b = req("POST", "/api/access", {"code": "H3DYPTJU"})
check("arhiviran -> 410 archived", s == 410 and js(b).get("reason") == "archived", f"{s} {b[:100]}")

print("\n[10] prazan termin")
s, b = req("POST", "/api/access", {"code": "HBJXFLBF"})
check("prazan termin -> 200, photoCount 0",
      s == 200 and js(b)["session"]["photoCount"] == 0, f"{s}")

print("\n[11] rate limit 10 / 15 min po IP")
limit_ip = f"198.51.100.{random.randint(2, 250)}"
results = []
for i in range(12):
    s, b = req("POST", "/api/access", {"code": f"ZZZZZ{i:03d}"[:8]}, ip=limit_ip)
    results.append((s, js(b).get("attemptsLeft")))
check("pogresan kod -> 401 sa attemptsLeft",
      results[0][0] == 401 and isinstance(results[0][1], int), results[0])
check("attemptsLeft opada", results[0][1] > results[3][1], [r[1] for r in results[:5]])
check("poslije 10 -> 429", any(r[0] == 429 for r in results), [r[0] for r in results])
s, b = req("POST", "/api/access", {"code": "K7XM4Q2P"}, ip=limit_ip)
check("ispravan kod blokiran dok traje limit", s == 429, s)
s, b = req("POST", "/api/access", {"code": "K7XM4Q2P"}, ip="192.0.2.77")
check("druga IP nije pogodjena limitom", s == 200, s)

print(f"\n{'=' * 52}\n{ok} proslo, {fail} palo\n{'=' * 52}")
print("\n[12] rafting traka — sve cetiri slike trazi markup")
# Traka je vodoravni viewport. Browserov lazy loading dohvata samo ono sto
# sijece ekran, a to je na 375px jedna slika i po — ostale tri se ne bi
# trazile dok ne uklize, pa bi okviri usli prazni. Zato ih markup trazi sam,
# bez cekanja na skrol, na JS ili na animaciju.
s, b = req("GET", "/")
home = b.decode("utf-8", "replace")
hangs = re.findall(r'<figure[^>]*data-hang="\d"[^>]*>.*?</figure>', home, re.S)
check("traka renderuje cetiri kadra", s == 200 and len(hangs) == 4, f"{s} {len(hangs)}")
srcs = [m for h in hangs for m in re.findall(r'<img[^>]*?src="(/\d\.webp)"', h)]
check("svaki kadar nosi svoju sliku", len(srcs) == 4, srcs)
lazy = [h for h in hangs if 'loading="lazy"' in h]
check("nijedan kadar u traci nije loading=lazy", not lazy, f"{len(lazy)} lazy")

print("\n[13] meni — traka ne smije biti sidro fioci")
# Fioka je position: fixed i mjeri se prema ekranu. Ali backdrop-filter (kao i
# filter, transform, perspective) na pretku pravi containing block za fixed
# potomke, a fioka je potomak trake — traka od 70px bi joj tad bila ekran i od
# sest stavki bi se vidjela pola prve. Zamucenje zato stoji na sloju ispod
# trake (::before), ne na samoj traci.
SIDRO = ("backdrop-filter", "filter", "transform", "perspective")
s, b = req("GET", "/")
home = b.decode("utf-8", "replace")
check("homepage se renderuje", s == 200, f"{s}")

# pravila koja ciljaju samu traku, bez pseudo-elemenata
# samo pravilo za samu traku: bez pseudo-elementa i bez potomaka
trake = [
    m.group(0)
    for m in re.finditer(r"\.nav-overlay[^{}]*\{[^{}]*\}", home)
    if re.fullmatch(r"\.nav-overlay[\w.-]*", m.group(0).split("{")[0].strip())
]
check("pronadjeno pravilo za overlay traku", bool(trake), trake)
lose = [t for t in trake for p in SIDRO if re.search(r"[{;]\s*" + p + r"\s*:", t)]
check("traka ne nosi nista sto pravi containing block", not lose, lose[:1])
check("zamucenje i dalje postoji, na sloju ispod",
      bool(re.search(r"\.nav-overlay[^{}]*::before[^{}]*\{[^{}]*backdrop-filter", home)),
      "nema ::before sloja sa backdrop-filter")

sys.exit(1 if fail else 0)
