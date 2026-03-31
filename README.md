# GameGrid

Site e-commerce B2C pentru jocuri PC, realizat in Node.js + Express + SQLite.

## Pornire

1. Instaleaza dependentele:

```bash
npm install
```

2. Ruleaza aplicatia:

```bash
npm start
```

3. Deschide:

```text
http://localhost:3000
```

## Plata cu cardul (Stripe)

Configureaza variabilele:

- `STRIPE_SECRET_KEY` = cheia secreta Stripe
- `APP_BASE_URL` = URL-ul public al aplicatiei (ex: `https://gamegrid.example.com`)

Exemplu PowerShell:

```powershell
$env:STRIPE_SECRET_KEY="sk_live_..."
$env:APP_BASE_URL="https://gamegrid.example.com"
npm start
```

In pagina de plata vei avea butonul `Plateste securizat` care redirectioneaza catre Stripe Checkout.

## Functionalitati implementate

- navigare cu meniuri responsive
- catalog de jocuri cu categorii si cautare
- pagina de detalii joc (pret, stoc, descriere)
- cos de cumparaturi cu actualizare cantitate
- cont client si autentificare
- inregistrare comanda
- stocuri si promotii
- factura HTML
- plata electronica cu Stripe Checkout
- administrare produse, utilizatori si comenzi
- modul original: `Loadout Personalizat`

## Baza de date

Fisier SQLite: `data/store.db`

Tabele:

- `categories`
- `products`
- `users`
- `orders`
- `order_items`
- `payments`

## Publicare

### GitHub Pages (pagina proiect)

Repository-ul include workflow-ul `.github/workflows/deploy-pages.yml` care publica folderul `docs/` pe GitHub Pages.

Pasii:

1. Urca codul pe GitHub in branch-ul `main`.
2. In GitHub: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
3. Ruleaza workflow-ul `Deploy GitHub Pages` (automat la push pe `main` sau manual).
4. Pagina va fi disponibila la `https://<user>.github.io/<repo>/`.

### Aplicatia completa (backend + DB)

GitHub Pages NU poate rula backend Node.js/Express sau SQLite.
Pentru aplicatia completa foloseste un hosting Node.js (Render/Railway/Fly.io/VPS).
