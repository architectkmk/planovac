# Docházka

Samostatná webová aplikace pro evidenci docházky a denních úkolů.
Přihlášení firemním Google účtem, data se ukládají do Google Sheets, nasazení na Vercel.

- **Přehled** (`/`) — výběr dne v týdnu, příchod / odchod / pauza / přesčas,
  seznam úkolů dne, měsíční souhrn odpracovaných hodin. Vše se ukládá samo
  po opuštění políčka.
- **Export** (`/export`) — libovolné období, přehled po dnech včetně úkolů,
  tlačítko pro tisk nebo uložení do PDF.

Každý vidí a edituje jen svoje záznamy. Data celého týmu jsou pohromadě
v jedné Google tabulce — kdo do ní má přístup, vidí všechny.

## Technologie

Next.js 15 (App Router) · TypeScript · Auth.js (Google) · Google Sheets API

## Nastavení

### 1. Google tabulka

Založte novou tabulku na [sheets.new](https://sheets.new). ID najdete v adrese:

```
https://docs.google.com/spreadsheets/d/TOHLE_JE_ID/edit
```

Listy `Dochazka` a `Ukoly` si aplikace založí sama při prvním zápisu,
včetně hlaviček. Ručně nic vytvářet nemusíte.

### 2. Servisní účet (zápis do tabulky)

V [Google Cloud Console](https://console.cloud.google.com):

1. Vytvořte projekt (nebo použijte existující).
2. **APIs & Services → Library** → zapněte **Google Sheets API**.
3. **IAM & Admin → Service Accounts → Create service account** → jméno → Done.
4. U vytvořeného účtu **Keys → Add key → Create new key → JSON** → stáhne se soubor.
5. Ze staženého JSONu vezměte `client_email` a `private_key`.
6. **Důležité:** v Google tabulce dejte **Sdílet** a přidejte `client_email`
   servisního účtu jako **Editor**. Bez toho aplikace do tabulky nezapíše.

### 3. Přihlášení Google účtem

Ve stejném projektu v Cloud Console:

1. **APIs & Services → OAuth consent screen** → typ **Internal**, pokud máte
   Google Workspace (pak se přihlásí jen lidé z firmy), jinak **External**.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Do **Authorized redirect URIs** přidejte:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://VASE-DOMENA.vercel.app/api/auth/callback/google` (doplňte po prvním nasazení)
4. Vzniklé **Client ID** a **Client secret** patří do proměnných prostředí.

### 4. Spuštění lokálně

```bash
npm install
cp .env.example .env.local
npx auth secret          # vygeneruje AUTH_SECRET do .env.local
npm run dev
```

Zbytek proměnných v `.env.local` doplňte podle `.env.example`.
Aplikace poběží na <http://localhost:3000>.

### 5. Nasazení na Vercel

1. Nahrajte složku do Git repozitáře:

   ```bash
   git init && git add . && git commit -m "Docházka"
   ```

   a pushněte na GitHub.
2. Na [vercel.com](https://vercel.com) **Add New → Project** → vyberte repozitář.
3. V **Settings → Environment Variables** vyplňte všechny proměnné
   z `.env.example`. `GOOGLE_PRIVATE_KEY` vložte celý včetně řádků
   `-----BEGIN PRIVATE KEY-----` a `-----END PRIVATE KEY-----`.
4. Deploy.
5. Výslednou adresu (`https://neco.vercel.app`) doplňte do
   **Authorized redirect URIs** v Google Cloud Console — viz krok 3.

Náhledová (preview) nasazení mají pokaždé jinou adresu, kterou Google
nezná, takže přihlášení funguje spolehlivě jen na produkční doméně.

## Proměnné prostředí

| Proměnná | K čemu je |
|---|---|
| `AUTH_SECRET` | Podpis přihlašovacích cookies. Vygeneruje `npx auth secret`. |
| `AUTH_GOOGLE_ID` | OAuth Client ID z Google Cloud Console. |
| `AUTH_GOOGLE_SECRET` | OAuth Client secret. |
| `POVOLENA_DOMENA` | Doména firmy, např. `neresen.cz`. Kdo má e-mail jinde, dovnitř nesmí. |
| `POVOLENE_EMAILY` | Konkrétní e-maily navíc, oddělené čárkou. Nepovinné. |
| `SHEET_ID` | ID Google tabulky z její adresy. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` ze staženého JSON klíče. |
| `GOOGLE_PRIVATE_KEY` | `private_key` ze staženého JSON klíče. |

Když není vyplněná `POVOLENA_DOMENA` ani `POVOLENE_EMAILY`, aplikace
nepustí dovnitř nikoho. Je to schválně — bezpečnější než otevřít appku
komukoli s Google účtem.

## Struktura dat v tabulce

**List `Dochazka`** — jeden řádek na člověka a den:

| email | jmeno | datum | prichod | odchod | pauza | prescas | odpracovano | minuty | aktualizovano |
|---|---|---|---|---|---|---|---|---|---|

Sloupec `minuty` je číslo, takže se dá v tabulce přímo sčítat
(`=SUMIF(A:A;"jan@firma.cz";I:I)/60` dá hodiny).

**List `Ukoly`** — jeden řádek na úkol:

| email | jmeno | datum | ukol | cas | aktualizovano |
|---|---|---|---|---|---|

Do tabulky se dá psát i ručně, aplikace to přečte. Jen neměňte
názvy sloupců v prvním řádku a formát data (`RRRR-MM-DD`) — podle
nich se řádky hledají.

## Na co si dát pozor

- **Souběžný zápis.** Google Sheets neumí zámky. Když dva lidé zapisují
  ve stejnou vteřinu, může se řádek přepsat. Při běžném provozu (každý
  píše svoje, jednou za den) se to prakticky nestane. Kdyby appku
  používalo víc než ~10 lidí naráz, stojí za to přejít na databázi.
- **Limity API.** Google dává 300 čtení/min na projekt a 60 na uživatele.
  Aplikace čte tabulku při každém přepnutí dne, takže na desítkách
  uživatelů je rezerva dostatečná, na stovkách už ne.
- **Rychlost.** Každé uložení je volání Google API, typicky 0,3–1 s.
  Proto se ukládá až po opuštění políčka, ne při každém stisku klávesy.

## Struktura projektu

```
app/
  page.tsx              přehled (docházka + úkoly + souhrn)
  export/page.tsx       export za období
  prihlaseni/page.tsx   přihlašovací obrazovka
  api/dochazka          GET ?datum= , POST
  api/ukoly             GET ?datum= , PUT
  api/mesic             GET ?mesic=RRRR-MM  (měsíční souhrn)
  api/rozsah            GET ?od= &do=       (podklady pro export)
components/             UI komponenty
lib/
  sheets.ts             čtení a zápis do Google Sheets
  cas.ts                výpočty odpracovaného času
  datum.ts              práce s datem a týdnem
auth.ts                 nastavení přihlášení a kdo má přístup
middleware.ts           přesměrování nepřihlášených na /prihlaseni
```
