# KICKAST — Backend (pośrednik do API-Football)

Ten backend ma jedno zadanie: **ukrywać Twój klucz API**. Aplikacja nigdy nie zna klucza — pyta ten backend, a backend pyta API-Football z kluczem schowanym na serwerze.

```
Aplikacja  →  TEN backend (klucz ukryty)  →  API-Football
 (telefon)      (Vercel)                       (dane meczów)
```

---

## Co jest w środku

- `api/fixtures.js` — główny endpoint: pobiera mecze (po dacie lub lidze) i zwraca je w prostym formacie, który rozumie aplikacja
- `api/health.js` — sprawdzenie, czy backend działa i czy klucz jest ustawiony (nie pokazuje samego klucza)
- `package.json`, `.gitignore`, `.env.example` — pliki pomocnicze

---

## Wdrożenie krok po kroku (ok. 10 minut)

### 1. Załóż konto na Vercel
Wejdź na https://vercel.com → **Sign Up** (najłatwiej przez konto GitHub). Darmowy plan w zupełności wystarczy.

### 2. Zainstaluj narzędzie Vercel na Macu
Otwórz aplikację **Terminal** i wpisz:
```bash
npm install -g vercel
```
(Jeśli nie masz Node.js — pobierz go najpierw z https://nodejs.org, wersja LTS.)

### 3. Wejdź do folderu z backendem
W Terminalu przejdź do tego folderu, np.:
```bash
cd ~/Downloads/kickast-backend
```

### 4. Uruchom wdrożenie
```bash
vercel
```
Przy pierwszym razie poprosi o zalogowanie i zada kilka pytań — na wszystkie możesz nacisnąć Enter (domyślne odpowiedzi są OK). Na końcu dostaniesz adres typu:
```
https://kickast-backend-twojanazwa.vercel.app
```
**Zapisz ten adres** — będzie potrzebny w aplikacji.

### 5. Wpisz swój klucz API (najważniejszy krok!)
W panelu Vercel:
1. Otwórz swój projekt → zakładka **Settings**
2. Wejdź w **Environment Variables**
3. Dodaj nową zmienną:
   - **Name:** `API_FOOTBALL_KEY`
   - **Value:** *(tu wklej swój świeży klucz z API-Football)*
4. Zapisz

### 6. Wdróż ponownie (żeby klucz "wszedł")
```bash
vercel --prod
```

### 7. Sprawdź, że działa
Otwórz w przeglądarce (podmień na swój adres):
```
https://twoj-adres.vercel.app/api/health
```
Powinieneś zobaczyć `"keyConfigured": true`. Jeśli tak — backend działa i widzi klucz. 🎉

Potem sprawdź mecze:
```
https://twoj-adres.vercel.app/api/fixtures
```
Zobaczysz dzisiejsze mecze w formacie JSON.

---

## Jak aplikacja z tego korzysta

Aplikacja będzie wołać:
- `GET /api/fixtures` — mecze na dziś
- `GET /api/fixtures?date=2026-06-16` — mecze z konkretnego dnia
- `GET /api/fixtures?league=106&season=2025` — mecze konkretnej ligi (106 to przykładowe ID Ekstraklasy w API-Football)

Następny krok: podłączę aplikację do tego adresu, żeby zamiast danych przykładowych pobierała prawdziwe mecze.

---

## Bezpieczeństwo — pamiętaj

- ❌ Nigdy nie wklejaj klucza do kodu aplikacji ani do plików wrzucanych do gita
- ✅ Klucz żyje wyłącznie w Environment Variables na Vercel
- ✅ Jeśli klucz kiedykolwiek "wycieknie" — wygeneruj nowy w API-Football i podmień w Vercel
