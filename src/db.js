const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const configuredSqlitePath = String(process.env.SQLITE_PATH || "").trim();
const configuredDataDir = String(process.env.DATA_DIR || "").trim();
const resolvedDataDir = configuredDataDir ? path.resolve(configuredDataDir) : path.join(__dirname, "..", "data");
const dbPath = configuredSqlitePath || path.join(resolvedDataDir, "store.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

const steamImage = (appId) =>
  `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

const categories = [
  {
    slug: "actiune-aventura",
    name: "Actiune & Aventura",
    description: "Open-world, povesti cinematice si aventuri intense.",
  },
  {
    slug: "rpg",
    name: "RPG",
    description: "Lumi vaste, build-uri complexe si sute de ore de progresie.",
  },
  {
    slug: "shooter",
    name: "Shooter",
    description: "FPS si co-op shooters pentru reflexe rapide si multiplayer.",
  },
  {
    slug: "racing-simulare",
    name: "Racing & Simulare",
    description: "Masini, viteza, trasee si simulatoare pentru fanii condusului.",
  },
  {
    slug: "indie-horror",
    name: "Indie & Horror",
    description: "Jocuri atmosferice, creative si horror-uri memorabile.",
  },
];

const products = [
  {
    categorySlug: "actiune-aventura",
    slug: "red-dead-redemption-2",
    appId: 1174180,
    name: "Red Dead Redemption 2",
    tagline: "Western open-world cu nivel urias de detaliu.",
    description:
      "Aventura cinematica in vestul salbatic, cu explorare ampla, misiuni memorabile si personaje foarte bine scrise.",
    priceCents: 17900,
    promoPercent: 15,
    stock: 24,
    accent: "#7B3F00",
    texture: "dust",
    featured: 1,
    concern: "open-world",
    image: steamImage(1174180),
  },
  {
    categorySlug: "actiune-aventura",
    slug: "god-of-war",
    appId: 1593500,
    name: "God of War",
    tagline: "Mitologie nordica si combat greu de uitat.",
    description:
      "Poveste emotionala si lupte intense intr-o aventura third-person foarte bine regizata.",
    priceCents: 19900,
    promoPercent: 10,
    stock: 18,
    accent: "#4E5D6C",
    texture: "frost",
    featured: 1,
    concern: "story",
    image: steamImage(1593500),
  },
  {
    categorySlug: "actiune-aventura",
    slug: "marvel-spider-man-remastered",
    appId: 1817070,
    name: "Marvel's Spider-Man Remastered",
    tagline: "Traversal excelent si actiune superhero de top.",
    description:
      "Swing fluid prin New York, combat rapid si o campanie foarte accesibila si spectaculoasa.",
    priceCents: 21900,
    promoPercent: 8,
    stock: 20,
    accent: "#B22222",
    texture: "swing",
    featured: 1,
    concern: "superhero",
    image: steamImage(1817070),
  },
  {
    categorySlug: "actiune-aventura",
    slug: "the-last-of-us-part-1",
    appId: 1888930,
    name: "The Last of Us Part I",
    tagline: "Survival emotional intr-o lume post-apocaliptica.",
    description:
      "Remake modern al unui clasic narativ, cu stealth, crafting si o relatie centrala foarte puternica.",
    priceCents: 23900,
    promoPercent: 12,
    stock: 15,
    accent: "#5F6B5B",
    texture: "grit",
    featured: 0,
    concern: "survival",
    image: steamImage(1888930),
  },
  {
    categorySlug: "actiune-aventura",
    slug: "ghost-of-tsushima-directors-cut",
    appId: 2215430,
    name: "Ghost of Tsushima Director's Cut",
    tagline: "Samurai, dueluri elegante si peisaje superbe.",
    description:
      "Un action-adventure rafinat, cu stealth, explorare si dueluri precise in Japonia feudala.",
    priceCents: 23900,
    promoPercent: 5,
    stock: 17,
    accent: "#8B1E3F",
    texture: "wind",
    featured: 1,
    concern: "samurai",
    image: steamImage(2215430),
  },
  {
    categorySlug: "actiune-aventura",
    slug: "star-wars-jedi-fallen-order",
    appId: 1172380,
    name: "Star Wars Jedi: Fallen Order",
    tagline: "Lightsaber combat si aventura sci-fi.",
    description:
      "Explorare planetara, platforming si lupte inspirate din soulslike, intr-un univers Star Wars foarte bine redat.",
    priceCents: 13900,
    promoPercent: 20,
    stock: 22,
    accent: "#2E4A62",
    texture: "pulse",
    featured: 0,
    concern: "sci-fi",
    image: steamImage(1172380),
  },

  {
    categorySlug: "rpg",
    slug: "elden-ring",
    appId: 1245620,
    name: "Elden Ring",
    tagline: "Action RPG vast si plin de secrete.",
    description:
      "Explorare libera, build-uri diverse si boss fights memorabile intr-un fantasy monumental.",
    priceCents: 20900,
    promoPercent: 10,
    stock: 30,
    accent: "#9C7A2B",
    texture: "golden",
    featured: 1,
    concern: "soulslike",
    image: steamImage(1245620),
  },
  {
    categorySlug: "rpg",
    slug: "baldurs-gate-3",
    appId: 1086940,
    name: "Baldur's Gate 3",
    tagline: "RPG tactic cu libertate uriasa.",
    description:
      "Dialoguri complexe, combat turn-based excelent si una dintre cele mai apreciate experiente RPG recente.",
    priceCents: 22900,
    promoPercent: 5,
    stock: 21,
    accent: "#6C4A2D",
    texture: "arcane",
    featured: 1,
    concern: "party-rpg",
    image: steamImage(1086940),
  },
  {
    categorySlug: "rpg",
    slug: "cyberpunk-2077",
    appId: 1091500,
    name: "Cyberpunk 2077",
    tagline: "Night City, augmentari si RPG sci-fi cu stil.",
    description:
      "Un RPG first-person urban, cu progresie flexibila, arme, implanturi si o atmosfera futurista foarte puternica.",
    priceCents: 18900,
    promoPercent: 18,
    stock: 26,
    accent: "#D6B500",
    texture: "neon",
    featured: 1,
    concern: "cyberpunk",
    image: steamImage(1091500),
  },
  {
    categorySlug: "rpg",
    slug: "the-witcher-3-wild-hunt",
    appId: 292030,
    name: "The Witcher 3: Wild Hunt",
    tagline: "Fantasy matur cu quest-uri legendare.",
    description:
      "Un RPG open-world iconic, cu personaje memorabile, poveste ramificata si continut extrem de generos.",
    priceCents: 14900,
    promoPercent: 25,
    stock: 28,
    accent: "#4C4C4C",
    texture: "steel",
    featured: 0,
    concern: "fantasy",
    image: steamImage(292030),
  },
  {
    categorySlug: "rpg",
    slug: "hogwarts-legacy",
    appId: 990080,
    name: "Hogwarts Legacy",
    tagline: "Lume magica, vraji si explorare la Hogwarts.",
    description:
      "Action RPG accesibil, cu dueluri magice, puzzle-uri si o lume familiara pentru fanii universului Harry Potter.",
    priceCents: 19900,
    promoPercent: 15,
    stock: 19,
    accent: "#5B3E96",
    texture: "spell",
    featured: 0,
    concern: "magic",
    image: steamImage(990080),
  },
  {
    categorySlug: "rpg",
    slug: "dark-souls-iii",
    appId: 374320,
    name: "Dark Souls III",
    tagline: "Boss fights grele si atmosfera gotica.",
    description:
      "Un action RPG provocator, cu level design excelent si combat care cere precizie si rabdare.",
    priceCents: 15900,
    promoPercent: 12,
    stock: 13,
    accent: "#3D3D3D",
    texture: "ember",
    featured: 0,
    concern: "difficulty",
    image: steamImage(374320),
  },
  {
    categorySlug: "rpg",
    slug: "persona-3-reload",
    appId: 2161700,
    name: "Persona 3 Reload",
    tagline: "JRPG stylish cu social sim si dungeon crawling.",
    description:
      "Remake modern al unui clasic JRPG, cu prezentare excelenta, soundtrack memorabil si progresie foarte satisfacatoare.",
    priceCents: 21900,
    promoPercent: 0,
    stock: 14,
    accent: "#2F5DA8",
    texture: "velour",
    featured: 1,
    concern: "jrpg",
    image: steamImage(2161700),
  },

  {
    categorySlug: "shooter",
    slug: "counter-strike-2",
    appId: 730,
    name: "Counter-Strike 2",
    tagline: "Shooter tactic iconic bazat pe skill.",
    description:
      "Competitiv, precis si esential pentru scena esports, cu un gameplay construit in jurul reflexelor si coordonarii.",
    priceCents: 0,
    promoPercent: 0,
    stock: 999,
    accent: "#C47A2C",
    texture: "flash",
    featured: 1,
    concern: "esports",
    image: steamImage(730),
  },
  {
    categorySlug: "shooter",
    slug: "rainbow-six-siege",
    appId: 359550,
    name: "Tom Clancy's Rainbow Six Siege",
    tagline: "Tactic, tensionat si bazat pe echipa.",
    description:
      "Un shooter competitiv in care pozitionarea, gadget-urile si comunicarea conteaza enorm.",
    priceCents: 9900,
    promoPercent: 30,
    stock: 19,
    accent: "#C9A227",
    texture: "breach",
    featured: 0,
    concern: "tactical",
    image: steamImage(359550),
  },
  {
    categorySlug: "shooter",
    slug: "doom-eternal",
    appId: 782330,
    name: "DOOM Eternal",
    tagline: "Combat brutal si mobilitate extrema.",
    description:
      "Un FPS single-player foarte rapid, centrat pe agresivitate, ritm si control impecabil al arenei.",
    priceCents: 11900,
    promoPercent: 20,
    stock: 16,
    accent: "#8B0000",
    texture: "inferno",
    featured: 0,
    concern: "fast-fps",
    image: steamImage(782330),
  },
  {
    categorySlug: "shooter",
    slug: "battlefield-2042",
    appId: 1517290,
    name: "Battlefield 2042",
    tagline: "Batalii mari, vehicule si haos controlat.",
    description:
      "Shooter orientat spre conflict pe scara larga, cu vehicule, specialisti si harti extinse.",
    priceCents: 12900,
    promoPercent: 22,
    stock: 23,
    accent: "#3D566E",
    texture: "storm",
    featured: 0,
    concern: "large-scale",
    image: steamImage(1517290),
  },
  {
    categorySlug: "shooter",
    slug: "helldivers-2",
    appId: 553850,
    name: "Helldivers 2",
    tagline: "Co-op intens si haotic, cu mult friendly fire.",
    description:
      "Un third-person shooter cooperativ foarte popular, cu misiuni explozive si progresie satisfacatoare.",
    priceCents: 19900,
    promoPercent: 5,
    stock: 27,
    accent: "#F0C419",
    texture: "flare",
    featured: 1,
    concern: "co-op",
    image: steamImage(553850),
  },
  {
    categorySlug: "shooter",
    slug: "destiny-2",
    appId: 1085660,
    name: "Destiny 2",
    tagline: "Gunplay excelent si univers sci-fi in continua expansiune.",
    description:
      "Shooter live-service cu raiduri, loot, abilitați speciale si activitati PvE si PvP.",
    priceCents: 0,
    promoPercent: 0,
    stock: 999,
    accent: "#6A5ACD",
    texture: "void",
    featured: 0,
    concern: "looter-shooter",
    image: steamImage(1085660),
  },

  {
    categorySlug: "racing-simulare",
    slug: "forza-horizon-5",
    appId: 1551360,
    name: "Forza Horizon 5",
    tagline: "Racing open-world vibrant si accesibil.",
    description:
      "Curse spectaculoase intr-un Mexic vast si colorat, cu o selectie uriasa de masini.",
    priceCents: 17900,
    promoPercent: 10,
    stock: 29,
    accent: "#D35400",
    texture: "sunset",
    featured: 1,
    concern: "arcade-racing",
    image: steamImage(1551360),
  },
  {
    categorySlug: "racing-simulare",
    slug: "forza-horizon-4",
    appId: 1293830,
    name: "Forza Horizon 4",
    tagline: "Sezoane dinamice si curse foarte fluide.",
    description:
      "Open-world racing cu schimbari sezoniere si o atmosfera foarte relaxata, ideala pentru colectat masini si explorare.",
    priceCents: 14900,
    promoPercent: 18,
    stock: 21,
    accent: "#E67E22",
    texture: "autumn",
    featured: 0,
    concern: "festival-racing",
    image: steamImage(1293830),
  },
  {
    categorySlug: "racing-simulare",
    slug: "euro-truck-simulator-2",
    appId: 227300,
    name: "Euro Truck Simulator 2",
    tagline: "Relaxare, transport si kilometri multi prin Europa.",
    description:
      "Simulator auto foarte popular, perfect pentru sesiuni lungi, progresie lenta si condus contemplativ.",
    priceCents: 8900,
    promoPercent: 15,
    stock: 32,
    accent: "#2E8B57",
    texture: "road",
    featured: 0,
    concern: "truck-sim",
    image: steamImage(227300),
  },
  {
    categorySlug: "racing-simulare",
    slug: "assetto-corsa",
    appId: 244210,
    name: "Assetto Corsa",
    tagline: "Sim-racing apreciat pentru handling si modding.",
    description:
      "Un joc foarte iubit de fanii sim-racing, cu fizica buna si o comunitate mare de moduri.",
    priceCents: 7900,
    promoPercent: 20,
    stock: 18,
    accent: "#34495E",
    texture: "asphalt",
    featured: 0,
    concern: "simulation",
    image: steamImage(244210),
  },
  {
    categorySlug: "racing-simulare",
    slug: "descenders",
    appId: 681280,
    name: "Descenders",
    tagline: "Downhill biking procedural si foarte satisfacator.",
    description:
      "Un joc de ciclism arcade bazat pe flow, trasee generate procedural si control foarte bun.",
    priceCents: 10900,
    promoPercent: 12,
    stock: 16,
    accent: "#27AE60",
    texture: "trail",
    featured: 0,
    concern: "extreme-sports",
    image: steamImage(681280),
  },
  {
    categorySlug: "racing-simulare",
    slug: "carx-drift-racing-online",
    appId: 635260,
    name: "CarX Drift Racing Online",
    tagline: "Drift accesibil, tuning si multiplayer.",
    description:
      "Ideal pentru fanii drift-ului si ai customizarii, cu control bun si curse online foarte distractive.",
    priceCents: 9900,
    promoPercent: 10,
    stock: 20,
    accent: "#9B59B6",
    texture: "drift",
    featured: 0,
    concern: "drifting",
    image: steamImage(635260),
  },

  {
    categorySlug: "indie-horror",
    slug: "hades",
    appId: 1145360,
    name: "Hades",
    tagline: "Roguelike stylish cu combat excelent.",
    description:
      "Un indie foarte apreciat, rapid, fluid si extrem de replayable, cu dialoguri si progresie foarte bine gandite.",
    priceCents: 9900,
    promoPercent: 15,
    stock: 34,
    accent: "#8E44AD",
    texture: "ember",
    featured: 1,
    concern: "roguelike",
    image: steamImage(1145360),
  },
  {
    categorySlug: "indie-horror",
    slug: "hollow-knight",
    appId: 367520,
    name: "Hollow Knight",
    tagline: "Metroidvania melancolic cu explorare profunda.",
    description:
      "Un joc indie foarte iubit, cu lume interconectata, boss fights memorabile si o atmosfera aparte.",
    priceCents: 6900,
    promoPercent: 10,
    stock: 31,
    accent: "#2C3E50",
    texture: "mist",
    featured: 1,
    concern: "metroidvania",
    image: steamImage(367520),
  },
  {
    categorySlug: "indie-horror",
    slug: "inside",
    appId: 304430,
    name: "INSIDE",
    tagline: "Puzzle-platformer sumbru si elegant.",
    description:
      "Experienta scurta, intensa si foarte bine regizata, bazata pe atmosfera si imagini memorabile.",
    priceCents: 4900,
    promoPercent: 20,
    stock: 25,
    accent: "#3A3A3A",
    texture: "shadow",
    featured: 0,
    concern: "atmosphere",
    image: steamImage(304430),
  },
  {
    categorySlug: "indie-horror",
    slug: "little-nightmares-ii",
    appId: 860510,
    name: "Little Nightmares II",
    tagline: "Horror stilizat cu puzzle-uri si tensiune.",
    description:
      "Un joc cu identitate vizuala foarte puternica, bazat pe traversare, mister si disconfort subtil.",
    priceCents: 8900,
    promoPercent: 18,
    stock: 22,
    accent: "#7A6A3A",
    texture: "fog",
    featured: 0,
    concern: "stylized-horror",
    image: steamImage(860510),
  },
  {
    categorySlug: "indie-horror",
    slug: "phasmophobia",
    appId: 739630,
    name: "Phasmophobia",
    tagline: "Co-op horror cu investigatii paranormale.",
    description:
      "Un horror multiplayer foarte popular, centrat pe comunicare, tensiune si identificarea fantomelor.",
    priceCents: 6500,
    promoPercent: 0,
    stock: 27,
    accent: "#4B5563",
    texture: "echo",
    featured: 1,
    concern: "co-op-horror",
    image: steamImage(739630),
  },
  {
    categorySlug: "indie-horror",
    slug: "dead-by-daylight",
    appId: 381210,
    name: "Dead by Daylight",
    tagline: "Asymmetric horror cu vanatoare si supravietuire.",
    description:
      "Un multiplayer horror foarte cunoscut, cu meciuri tensionate 4v1 si multe colaborari cu francize celebre.",
    priceCents: 7900,
    promoPercent: 25,
    stock: 26,
    accent: "#6B0F1A",
    texture: "night",
    featured: 1,
    concern: "asymmetrical",
    image: steamImage(381210),
  },
];

function initDb() {
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      promo_percent INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      accent TEXT NOT NULL,
      texture TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      concern TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      subtotal_cents INTEGER NOT NULL,
      product_discount_cents INTEGER NOT NULL DEFAULT 0,
      coupon_discount_cents INTEGER NOT NULL DEFAULT 0,
      tax_cents INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Inregistrata',
      payment_status TEXT NOT NULL DEFAULT 'Neplatita',
      shipping_name TEXT NOT NULL,
      shipping_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_zip TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total_cents INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      gateway TEXT NOT NULL,
      card_last4 TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  ensureProductImageColumn();

  seedCategories();
  seedProducts();
  backfillProductImages();
  seedUsers();
}

function ensureProductImageColumn() {
  const columns = db.prepare("PRAGMA table_info(products)").all();
  const hasImage = columns.some((column) => column.name === "image");
  if (!hasImage) {
    db.exec("ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT ''");
  }
}

function seedCategories() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(
    "INSERT INTO categories (slug, name, description) VALUES (@slug, @name, @description)"
  );
  const transaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });
  transaction(categories);
}

function seedProducts() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  if (count > 0) {
    return;
  }

  const getCategoryId = db.prepare("SELECT id FROM categories WHERE slug = ?");
  const insert = db.prepare(`
    INSERT INTO products (
      category_id, slug, name, tagline, description, price_cents, promo_percent, stock,
      accent, texture, featured, concern, image
    )
    VALUES (
      @category_id, @slug, @name, @tagline, @description, @price_cents, @promo_percent, @stock,
      @accent, @texture, @featured, @concern, @image
    )
  `);

  const transaction = db.transaction((items) => {
    for (const item of items) {
      const category = getCategoryId.get(item.categorySlug);
      insert.run({
        category_id: category.id,
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        price_cents: item.priceCents,
        promo_percent: item.promoPercent,
        stock: item.stock,
        accent: item.accent,
        texture: item.texture,
        featured: item.featured,
        concern: item.concern,
        image: item.image,
      });
    }
  });

  transaction(products);
}

function backfillProductImages() {
  const updateImage = db.prepare(
    "UPDATE products SET image = ? WHERE slug = ? AND (image IS NULL OR image = '')"
  );

  const transaction = db.transaction((items) => {
    for (const item of items) {
      updateImage.run(item.image, item.slug);
    }
  });

  transaction(products);
}

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) {
    return;
  }

  const insert = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
  );

  insert.run("Administrator GameGrid", "admin@gamegrid.ro", bcrypt.hashSync("admin123", 10), "admin");
  insert.run("Client Demo", "client@gamegrid.ro", bcrypt.hashSync("client123", 10), "customer");
}

module.exports = {
  db,
  initDb,
};
