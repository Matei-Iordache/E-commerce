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

## Conturi demo

- Client: `client@gamegrid.ro` / `client123`
- Admin: `admin@gamegrid.ro` / `admin123`

## Carduri de test pentru plata sandbox

- `4242 4242 4242 4242`
- `5555 5555 5555 4444`
- `4000 0000 0000 3220`

Expirare exemplu: `12/30`, CVV: `123`

## Plata cu carduri reale (Stripe)

Pentru plati reale, configureaza variabile de mediu:

- `STRIPE_SECRET_KEY` = cheia secreta Stripe (live sau test)
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
- plata electronica demo de tip sandbox
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

Aplicatia este pregatita pentru rulare pe orice hosting Node.js care permite persistenta unui fisier SQLite sau conectarea la o baza MySQL/SQLite separata. Dupa publicare, URL-ul public se trece in raportul din `docs/raport.md`.
