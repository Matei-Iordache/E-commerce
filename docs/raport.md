# Raport Proiect CE - GameGrid

## 1. Tipul de comert electronic implementat

Proiectul implementeaza un site de tip B2C (Business to Consumer), dedicat vanzarii online de jocuri PC.

## 2. Produsele comercializate si motivatia

Site-ul comercializeaza jocuri digitale din mai multe categorii:

- Actiune si aventura
- RPG
- Shooter
- Racing si simulare
- Indie si horror

Motivatie:

- piata de jocuri are structuri clare pe categorii, promotii si stocuri
- permite un flux de comanda si plata usor de demonstrat
- ofera context bun pentru un modul personalizat de recomandare

## 3. Model de referinta (Studiul de caz 1)

Ca model conceptual au fost analizate magazine de jocuri digitale care pun accent pe:

- catalog clar pe genuri
- pagini de produs cu detalii complete
- promotii vizibile
- checkout rapid

Directia vizuala finala este originala, sub brandul GameGrid.

## 4. Platforma software folosita (Studiul de caz 2)

Platforma aleasa este realizata manual:

- backend: Node.js + Express
- templating: EJS
- baza de date: SQLite

Motivatie:

- control total asupra cerintelor din proiect
- rulare locala rapida
- usurinta in implementarea modulelor personalizate

## 5. Tehnologii utilizate

- limbaj server-side: JavaScript (Node.js)
- interfata: HTML, CSS, JavaScript
- baza de date: SQLite

## 6. Unde este publicat

Pentru rulare locala:

- http://localhost:3000

Pentru predare:

- dupa publicare pe hosting Node.js, se completeaza aici linkul public
- daca nu este publicat, proiectul se arhiveaza in format zip

## 7. Cerinte obligatorii acoperite

1. Publicat pe site web: local (si pregatit pentru publicare)
2. Baza de date: SQLite
3. Scripturi server-side: Node.js + Express
4. Plata electronica: implementata si testata cu carduri sandbox

## 8. Elemente clasice B2C implementate

1. Sistem de navigare cu meniuri:
   - meniu principal responsive (CSS + JavaScript)
2. Catalog de produse:
   - pagina /catalog
3. Gruparea produselor pe categorii:
   - Actiune & Aventura, RPG, Shooter, Racing & Simulare, Indie & Horror
4. Vizualizare detalii produs:
   - pagina /products/:slug (pret, descriere, stoc)
5. Cos de cumparaturi + actualizare:
   - pagina /cart (modificare cantitate, stergere, cupoane)
6. Inregistrarea comenzii:
   - pagina /checkout (cu cont de utilizator)
7. Stocuri:
   - decrementare automata la plasare comanda
8. Promotii:
   - reduceri pe produs + cupoane GAME10/RAID15
9. Emiterea facturii:
   - pagina /orders/:code/invoice
10. Plata electronica a facturii:
   - pagina /checkout/:code/payment, cu carduri de test
11. Interfata de administrare:
   - /admin, /admin/products, /admin/orders, /admin/users

## 9. Personalizari

### 9.1. Module cu personalizari

- identitate vizuala proprie pentru GameGrid
- reguli de recomandare bazate pe stilul de joc
- integrare recomandari cu cosul de cumparaturi

### 9.2. Modul reprezentativ implementat

Modulul de originalitate este Loadout Personalizat (ruta: /ritual-personalizat).

Flux:

- utilizatorul alege experienta dorita (story, esports, co-op)
- alege stilul de sesiune (solo, ranked, chill)
- alege bugetul
- sistemul recomanda automat un mini-bundle de jocuri
- bundle-ul poate fi adaugat instant in cos

## 10. Screenshot-uri necesare pentru sustinere

- homepage
- meniu / navigare
- catalog de produse
- categorie filtrata
- pagina detalii produs
- cos de cumparaturi
- aplicare cod promotional
- inregistrare cont
- login
- checkout
- comanda inregistrata
- plata electronica demo
- factura emisa
- admin dashboard
- admin produse
- admin comenzi
- admin utilizatori
- modul Loadout Personalizat

## 11. Testarea platii electronice

Carduri de test acceptate:

- 4242 4242 4242 4242
- 5555 5555 5555 4444
- 4000 0000 0000 3220

Date test:

- expirare: 12/30
- CVV: 123

Rezultat asteptat:

- comanda devine Platita
- se insereaza tranzactie in tabela payments
- factura afiseaza gateway si ultimele 4 cifre ale cardului

## 12. PageSpeed

Cerinta proiectului: screenshot cu rezultatul din https://pagespeed.web.dev/

Pasi:

1. Publici proiectul pe un URL public.
2. Rulezi analiza in pagespeed.web.dev.
3. Salvezi captura rezultatului.
4. Adaugi captura in documentul final incarcat.

Observatie: pagespeed.web.dev nu analizeaza localhost.
