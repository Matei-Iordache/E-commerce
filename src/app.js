const path = require("path");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const { db } = require("./db");
const Stripe = require("stripe");

const app = express();
const VAT_RATE = 0.19;
const couponDefinitions = {
  GAME10: {
    label: "Reducere 10% pentru prima comanda",
    percent: 10,
    minimumSubtotalCents: 7000,
  },
  RAID15: {
    label: "15% pentru comenzi peste 120 lei",
    percent: 15,
    minimumSubtotalCents: 12000,
  },
};
const acceptedTestCards = {
  "4242424242424242": "Visa Sandbox",
  "5555555555554444": "Mastercard Sandbox",
  "4000000000003220": "3DS Sandbox",
};
const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(
  session({
    secret: "gamegrid-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(express.static(path.join(__dirname, "..", "public")));

app.use((req, res, next) => {
  req.session.cart = Array.isArray(req.session.cart) ? req.session.cart : [];
  const user = req.session.userId
    ? db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.session.userId)
    : null;

  res.locals.currentUser = user;
  res.locals.currentPath = req.path;
  res.locals.categories = db.prepare("SELECT * FROM categories ORDER BY name").all();
  res.locals.cartCount = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
  res.locals.formatMoney = formatMoney;
  res.locals.flash = req.session.flash || null;
  res.locals.activeCoupon = req.session.promoCode || null;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  const featuredProducts = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.featured = 1
    ORDER BY p.created_at DESC
    LIMIT 4
  `).all();

  const categoryHighlights = db.prepare(`
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();

  res.render("home", {
    title: "GameGrid",
    featuredProducts,
    categoryHighlights,
  });
});

app.get("/catalog", (req, res) => {
  const categorySlug = req.query.category || "";
  const query = (req.query.q || "").trim().toLowerCase();
  const filters = [];
  const params = {};

  if (categorySlug) {
    filters.push("c.slug = @categorySlug");
    params.categorySlug = categorySlug;
  }

  if (query) {
    filters.push("(LOWER(p.name) LIKE @query OR LOWER(p.description) LIKE @query OR LOWER(p.tagline) LIKE @query)");
    params.query = `%${query}%`;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY p.featured DESC, p.created_at DESC
  `).all(params);

  const selectedCategory = categorySlug
    ? db.prepare("SELECT * FROM categories WHERE slug = ?").get(categorySlug)
    : null;

  res.render("catalog", {
    title: selectedCategory ? selectedCategory.name : "Catalog",
    products,
    query,
    selectedCategory,
  });
});

app.get("/products/:slug", (req, res, next) => {
  const product = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ?
  `).get(req.params.slug);

  if (!product) {
    return next();
  }

  const relatedProducts = db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.category_id = ? AND p.id != ?
    ORDER BY p.featured DESC, p.created_at DESC
    LIMIT 3
  `).all(product.category_id, product.id);

  res.render("product", {
    title: product.name,
    product,
    relatedProducts,
  });
});

app.get("/ritual-personalizat", (req, res) => {
  res.render("ritual", {
    title: "Loadout Personalizat",
    result: null,
    answers: {},
  });
});

app.post("/ritual-personalizat", (req, res) => {
  const answers = {
    concern: req.body.concern || "story",
    mood: req.body.mood || "solo",
    budget: req.body.budget || "mediu",
  };
  const recommendedProducts = getRoutineRecommendations(answers);
  const total = recommendedProducts.reduce((sum, product) => sum + getDiscountedPrice(product), 0);

  res.render("ritual", {
    title: "Loadout Personalizat",
    answers,
    result: {
      recommendedProducts,
      total,
      message: buildRoutineMessage(answers),
    },
  });
});

app.post("/ritual-personalizat/add-bundle", (req, res) => {
  const ids = String(req.body.productIds || "")
    .split(",")
    .map((id) => Number(id))
    .filter(Boolean);

  for (const id of ids) {
    addToCart(req, id, 1);
  }

  setFlash(req, "success", "Loadout-ul recomandat a fost adaugat in cos.");
  res.redirect("/cart");
});

app.get("/cart", (req, res) => {
  const cart = hydrateCart(req.session.cart);
  const summary = calculateCartSummary(cart, req.session.promoCode);

  res.render("cart", {
    title: "Cos de Cumparaturi",
    cart,
    summary,
    couponDefinitions,
  });
});

app.post("/cart/add", (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Math.max(1, Number(req.body.quantity || 1));
  const result = addToCart(req, productId, quantity);
  setFlash(req, result.type, result.message);
  res.redirect(req.body.redirectTo || "/cart");
});

app.post("/cart/update", (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Math.max(0, Number(req.body.quantity || 0));
  const line = req.session.cart.find((item) => item.productId === productId);

  if (!line) {
    setFlash(req, "error", "Produsul nu mai exista in cos.");
    return res.redirect("/cart");
  }

  if (quantity === 0) {
    req.session.cart = req.session.cart.filter((item) => item.productId !== productId);
    setFlash(req, "success", "Produsul a fost eliminat din cos.");
    return res.redirect("/cart");
  }

  const product = db.prepare("SELECT stock FROM products WHERE id = ?").get(productId);
  line.quantity = Math.min(quantity, product.stock);
  setFlash(req, "success", "Cosul a fost actualizat.");
  res.redirect("/cart");
});

app.post("/cart/remove", (req, res) => {
  const productId = Number(req.body.productId);
  req.session.cart = req.session.cart.filter((item) => item.productId !== productId);
  setFlash(req, "success", "Produsul a fost scos din cos.");
  res.redirect("/cart");
});

app.post("/cart/coupon", (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  const cart = hydrateCart(req.session.cart);
  const summary = calculateCartSummary(cart, code);

  if (!couponDefinitions[code]) {
    setFlash(req, "error", "Codul promotional nu exista.");
    return res.redirect("/cart");
  }

  if (summary.couponDiscountCents === 0) {
    setFlash(req, "error", "Codul este valid, dar nu se aplica pentru cosul curent.");
    return res.redirect("/cart");
  }

  req.session.promoCode = code;
  setFlash(req, "success", `Cupon aplicat: ${couponDefinitions[code].label}.`);
  res.redirect("/cart");
});

app.post("/cart/coupon/remove", (req, res) => {
  delete req.session.promoCode;
  setFlash(req, "success", "Cuponul promotional a fost eliminat.");
  res.redirect("/cart");
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Creare Cont" });
});

app.post("/register", (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 6) {
    setFlash(req, "error", "Completeaza nume, email si o parola de minimum 6 caractere.");
    return res.redirect("/register");
  }

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existingUser) {
    setFlash(req, "error", "Exista deja un cont cu acest email.");
    return res.redirect("/register");
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
    .run(name, email, passwordHash);

  req.session.userId = result.lastInsertRowid;
  setFlash(req, "success", "Contul a fost creat. Poti continua comanda.");
  res.redirect("/account");
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Autentificare" });
});

app.post("/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    setFlash(req, "error", "Email sau parola invalide.");
    return res.redirect("/login");
  }

  req.session.userId = user.id;
  setFlash(req, "success", "Autentificare reusita.");
  res.redirect(user.role === "admin" ? "/admin" : "/account");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/account", requireAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT *
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(res.locals.currentUser.id);

  res.render("account", {
    title: "Contul Meu",
    orders,
  });
});

app.get("/checkout", requireAuth, (req, res) => {
  const cart = hydrateCart(req.session.cart);
  if (!cart.length) {
    setFlash(req, "error", "Cosul este gol.");
    return res.redirect("/catalog");
  }

  const summary = calculateCartSummary(cart, req.session.promoCode);
  res.render("checkout", {
    title: "Finalizare Comanda",
    cart,
    summary,
  });
});

app.post("/checkout", requireAuth, (req, res) => {
  const cart = hydrateCart(req.session.cart);
  if (!cart.length) {
    setFlash(req, "error", "Cosul este gol.");
    return res.redirect("/catalog");
  }

  const shippingName = String(req.body.shippingName || "").trim();
  const shippingEmail = String(req.body.shippingEmail || "").trim();
  const shippingAddress = String(req.body.shippingAddress || "").trim();
  const shippingCity = String(req.body.shippingCity || "").trim();
  const shippingZip = String(req.body.shippingZip || "").trim();
  const notes = String(req.body.notes || "").trim();

  if (!shippingName || !shippingEmail || !shippingAddress || !shippingCity || !shippingZip) {
    setFlash(req, "error", "Completeaza toate datele de livrare.");
    return res.redirect("/checkout");
  }

  const summary = calculateCartSummary(cart, req.session.promoCode);
  for (const item of cart) {
    if (item.stock < item.quantity) {
      setFlash(req, "error", `Stoc insuficient pentru ${item.name}.`);
      return res.redirect("/cart");
    }
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      user_id, code, subtotal_cents, product_discount_cents, coupon_discount_cents, tax_cents, total_cents,
      status, payment_status, shipping_name, shipping_email, shipping_address, shipping_city, shipping_zip, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Inregistrata', 'Neplatita', ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity, line_total_cents)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

  const orderCode = db.transaction(() => {
    const code = createOrderCode();
    const orderResult = insertOrder.run(
      res.locals.currentUser.id,
      code,
      summary.baseSubtotalCents,
      summary.productDiscountCents,
      summary.couponDiscountCents,
      summary.taxCents,
      summary.totalCents,
      shippingName,
      shippingEmail,
      shippingAddress,
      shippingCity,
      shippingZip,
      notes || null
    );

    for (const item of cart) {
      insertItem.run(
        orderResult.lastInsertRowid,
        item.id,
        item.name,
        item.finalPriceCents,
        item.quantity,
        item.finalPriceCents * item.quantity
      );
      updateStock.run(item.quantity, item.id);
    }

    return code;
  })();

  req.session.cart = [];
  delete req.session.promoCode;
  setFlash(req, "success", "Comanda a fost inregistrata. Urmeaza plata electronica.");
  res.redirect(`/checkout/${orderCode}/payment`);
});

app.get("/checkout/:code/payment", requireAuth, (req, res, next) => {
  const order = getOwnedOrder(req.params.code, res.locals.currentUser);
  if (!order) {
    return next();
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  const payment = db.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1").get(order.id);

  res.render("payment", {
    title: "Plata Electronica",
    order,
    items,
    payment,
    acceptedCards: acceptedTestCards,
    stripeEnabled: Boolean(stripe),
  });
});

app.post("/checkout/:code/payment/stripe-session", requireAuth, async (req, res) => {
  const order = getOwnedOrder(req.params.code, res.locals.currentUser);
  if (!order) {
    return res.redirect("/account");
  }

  if (!stripe) {
    setFlash(req, "error", "Plata cu card real nu este configurata pe server.");
    return res.redirect(`/checkout/${req.params.code}/payment`);
  }

  if (order.payment_status === "Platita") {
    setFlash(req, "success", "Comanda este deja achitata.");
    return res.redirect(`/orders/${order.code}/invoice`);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${resolveBaseUrl(req)}/checkout/${order.code}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${resolveBaseUrl(req)}/checkout/${order.code}/payment`,
      customer_email: order.shipping_email,
      metadata: {
        orderCode: order.code,
        orderId: String(order.id),
        userId: String(res.locals.currentUser.id),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "ron",
            unit_amount: order.total_cents,
            product_data: {
              name: `Comanda ${order.code}`,
              description: "GameGrid - plata comanda",
            },
          },
        },
      ],
    });

    return res.redirect(303, session.url);
  } catch (error) {
    setFlash(req, "error", "Nu am putut porni plata Stripe. Verifica setarile cheilor API.");
    return res.redirect(`/checkout/${order.code}/payment`);
  }
});

app.get("/checkout/:code/payment/success", requireAuth, async (req, res) => {
  const order = getOwnedOrder(req.params.code, res.locals.currentUser);
  if (!order) {
    return res.redirect("/account");
  }

  if (!stripe) {
    setFlash(req, "error", "Plata cu card real nu este configurata pe server.");
    return res.redirect(`/checkout/${req.params.code}/payment`);
  }

  if (order.payment_status === "Platita") {
    return res.redirect(`/orders/${order.code}/invoice`);
  }

  const sessionId = String(req.query.session_id || "").trim();
  if (!sessionId) {
    setFlash(req, "error", "Sesiune de plata lipsa.");
    return res.redirect(`/checkout/${order.code}/payment`);
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const isOrderMatch = checkoutSession.metadata && checkoutSession.metadata.orderCode === order.code;

    if (!isOrderMatch || checkoutSession.payment_status !== "paid") {
      setFlash(req, "error", "Plata nu a fost confirmata.");
      return res.redirect(`/checkout/${order.code}/payment`);
    }

    let cardLast4 = "----";
    if (checkoutSession.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(checkoutSession.payment_intent, {
        expand: ["latest_charge"],
      });
      cardLast4 = paymentIntent.latest_charge?.payment_method_details?.card?.last4 || "----";
    }

    db.transaction(() => {
      db.prepare(`
        INSERT INTO payments (order_id, gateway, card_last4, amount_cents, status, transaction_ref)
        VALUES (?, 'Stripe', ?, ?, 'captured', ?)
      `).run(order.id, cardLast4, order.total_cents, String(checkoutSession.payment_intent || checkoutSession.id));

      db.prepare(`
        UPDATE orders
        SET payment_status = 'Platita', status = 'In procesare'
        WHERE id = ?
      `).run(order.id);
    })();

    setFlash(req, "success", "Plata a fost confirmata prin Stripe.");
    return res.redirect(`/orders/${order.code}/invoice`);
  } catch (error) {
    setFlash(req, "error", "Nu am putut confirma plata Stripe.");
    return res.redirect(`/checkout/${order.code}/payment`);
  }
});

app.post("/checkout/:code/payment", requireAuth, (req, res) => {
  const order = getOwnedOrder(req.params.code, res.locals.currentUser);
  if (!order) {
    return res.redirect("/account");
  }

  if (order.payment_status === "Platita") {
    setFlash(req, "success", "Comanda este deja achitata.");
    return res.redirect(`/orders/${order.code}/invoice`);
  }

  const cardNumber = String(req.body.cardNumber || "").replace(/\s+/g, "");
  const cardholder = String(req.body.cardholder || "").trim();
  const expiry = String(req.body.expiry || "").trim();
  const cvv = String(req.body.cvv || "").trim();

  if (!acceptedTestCards[cardNumber] || !cardholder || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3,4}$/.test(cvv)) {
    setFlash(req, "error", "Plata a fost respinsa. Foloseste un card de test valid din lista afisata.");
    return res.redirect(`/checkout/${order.code}/payment`);
  }

  const transactionRef = `SBX-${Date.now()}`;
  db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (order_id, gateway, card_last4, amount_cents, status, transaction_ref)
      VALUES (?, ?, ?, ?, 'captured', ?)
    `).run(order.id, acceptedTestCards[cardNumber], cardNumber.slice(-4), order.total_cents, transactionRef);

    db.prepare(`
      UPDATE orders
      SET payment_status = 'Platita', status = 'In procesare'
      WHERE id = ?
    `).run(order.id);
  })();

  setFlash(req, "success", "Plata demo a fost capturata cu succes.");
  res.redirect(`/orders/${order.code}/invoice`);
});

app.get("/orders/:code/invoice", requireAuth, (req, res, next) => {
  const order = getOwnedOrder(req.params.code, res.locals.currentUser);
  if (!order) {
    return next();
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  const payment = db.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1").get(order.id);

  res.render("invoice", {
    title: `Factura ${order.code}`,
    order,
    items,
    payment,
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  const stats = {
    orders: db.prepare("SELECT COUNT(*) AS count FROM orders").get().count,
    users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
    products: db.prepare("SELECT COUNT(*) AS count FROM products").get().count,
    revenueCents:
      db.prepare("SELECT COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE payment_status = 'Platita'").get()
        .total,
  };

  const recentOrders = db.prepare(`
    SELECT o.*, u.name AS user_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
    LIMIT 6
  `).all();

  res.render("admin/dashboard", {
    title: "Administrare",
    stats,
    recentOrders,
  });
});

app.get("/admin/products", requireAdmin, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ORDER BY c.name, p.name
  `).all();

  res.render("admin/products", {
    title: "Administrare Produse",
    products,
  });
});

app.post("/admin/products", requireAdmin, (req, res) => {
  const categoryId = Number(req.body.categoryId);
  const name = String(req.body.name || "").trim();
  const slug = slugify(name);
  const tagline = String(req.body.tagline || "").trim();
  const description = String(req.body.description || "").trim();
  const priceCents = Math.round(Number(req.body.price || 0) * 100);
  const promoPercent = Math.max(0, Math.min(80, Number(req.body.promoPercent || 0)));
  const stock = Math.max(0, Number(req.body.stock || 0));
  const accent = String(req.body.accent || "#6B705C");
  const texture = String(req.body.texture || "studio");
  const featured = req.body.featured ? 1 : 0;
  const concern = String(req.body.concern || "general").trim();
  const image = String(req.body.image || "").trim();

  if (!categoryId || !name || !tagline || !description || priceCents <= 0) {
    setFlash(req, "error", "Completeaza toate campurile obligatorii pentru produs.");
    return res.redirect("/admin/products");
  }

  db.prepare(`
    INSERT INTO products (
      category_id, slug, name, tagline, description, price_cents, promo_percent, stock, accent, texture, featured, concern, image
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(categoryId, slug, name, tagline, description, priceCents, promoPercent, stock, accent, texture, featured, concern, image);

  setFlash(req, "success", "Produs nou adaugat in catalog.");
  res.redirect("/admin/products");
});

app.post("/admin/products/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const priceCents = Math.round(Number(req.body.price || 0) * 100);
  const promoPercent = Math.max(0, Math.min(80, Number(req.body.promoPercent || 0)));
  const stock = Math.max(0, Number(req.body.stock || 0));
  const featured = req.body.featured ? 1 : 0;

  db.prepare(`
    UPDATE products
    SET price_cents = ?, promo_percent = ?, stock = ?, featured = ?
    WHERE id = ?
  `).run(priceCents, promoPercent, stock, featured, id);

  setFlash(req, "success", "Produsul a fost actualizat.");
  res.redirect("/admin/products");
});

app.get("/admin/orders", requireAdmin, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.name AS user_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `).all();

  res.render("admin/orders", {
    title: "Administrare Comenzi",
    orders,
  });
});

app.post("/admin/orders/:id/status", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || "Inregistrata");
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  setFlash(req, "success", "Statusul comenzii a fost actualizat.");
  res.redirect("/admin/orders");
});

app.get("/admin/users", requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  res.render("admin/users", {
    title: "Administrare Utilizatori",
    users,
  });
});

app.use((req, res) => {
  res.status(404).render("404", { title: "Pagina Inexistenta" });
});

function requireAuth(req, res, next) {
  if (!res.locals.currentUser) {
    setFlash(req, "error", "Trebuie sa fii autentificat pentru a continua.");
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || res.locals.currentUser.role !== "admin") {
    setFlash(req, "error", "Accesul la zona de administrare este restrictionat.");
    return res.redirect("/login");
  }
  next();
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function formatMoney(cents) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
  }).format((cents || 0) / 100);
}

function getDiscountedPrice(product) {
  return Math.round(product.price_cents * (1 - product.promo_percent / 100));
}

function hydrateCart(rawCart) {
  if (!rawCart.length) {
    return [];
  }

  const productIds = rawCart.map((item) => item.productId);
  const placeholders = productIds.map(() => "?").join(", ");
  const products = db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id IN (${placeholders})
  `).all(...productIds);

  return rawCart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) {
        return null;
      }
      const finalPriceCents = getDiscountedPrice(product);

      return {
        ...product,
        quantity: item.quantity,
        finalPriceCents,
        lineTotalCents: finalPriceCents * item.quantity,
      };
    })
    .filter(Boolean);
}

function calculateCartSummary(cart, promoCode) {
  const baseSubtotalCents = cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  const discountedSubtotalCents = cart.reduce((sum, item) => sum + item.finalPriceCents * item.quantity, 0);
  const productDiscountCents = baseSubtotalCents - discountedSubtotalCents;
  const coupon = couponDefinitions[promoCode];
  let couponDiscountCents = 0;

  if (coupon && discountedSubtotalCents >= coupon.minimumSubtotalCents) {
    couponDiscountCents = Math.round(discountedSubtotalCents * (coupon.percent / 100));
  }

  const taxableBase = Math.max(0, discountedSubtotalCents - couponDiscountCents);
  const taxCents = Math.round(taxableBase * VAT_RATE);
  const totalCents = taxableBase + taxCents;

  return {
    baseSubtotalCents,
    discountedSubtotalCents,
    productDiscountCents,
    couponDiscountCents,
    taxCents,
    totalCents,
  };
}

function addToCart(req, productId, quantity) {
  const product = db.prepare("SELECT id, name, stock FROM products WHERE id = ?").get(productId);
  if (!product) {
    return { type: "error", message: "Produsul selectat nu exista." };
  }

  if (product.stock <= 0) {
    return { type: "error", message: "Produsul nu mai este disponibil in stoc." };
  }

  const existingLine = req.session.cart.find((item) => item.productId === productId);
  if (existingLine) {
    existingLine.quantity = Math.min(existingLine.quantity + quantity, product.stock);
  } else {
    req.session.cart.push({
      productId,
      quantity: Math.min(quantity, product.stock),
    });
  }

  return { type: "success", message: `${product.name} a fost adaugat in cos.` };
}

function createOrderCode() {
  const chunk = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GG-${new Date().getFullYear()}-${chunk}`;
}

function getOwnedOrder(code, user) {
  if (user.role === "admin") {
    return db.prepare("SELECT * FROM orders WHERE code = ?").get(code);
  }
  return db.prepare("SELECT * FROM orders WHERE code = ? AND user_id = ?").get(code, user.id);
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getRoutineRecommendations(answers) {
  const concernToCategories = {
    story: ["actiune-aventura", "rpg"],
    esports: ["shooter", "racing-simulare"],
    co_op: ["shooter", "indie-horror"],
  };
  const moodToConcerns = {
    solo: ["story", "open-world", "fantasy", "jrpg"],
    ranked: ["esports", "tactical", "fast-fps", "drifting"],
    chill: ["co-op", "arcade-racing", "roguelike", "metroidvania"],
  };

  const selectedCategories = concernToCategories[answers.concern] || ["rpg", "shooter"];
  const selectedConcerns = moodToConcerns[answers.mood] || ["story", "co-op"];

  const concernMatches = db.prepare(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE c.slug IN (?, ?)
      OR p.concern IN (?, ?, ?, ?)
    ORDER BY p.featured DESC, p.promo_percent DESC, p.created_at DESC
  `).all(
    selectedCategories[0],
    selectedCategories[1],
    selectedConcerns[0],
    selectedConcerns[1],
    selectedConcerns[2],
    selectedConcerns[3]
  );

  const budgetLimit = {
    mic: 9000,
    mediu: 16000,
    premium: 999999,
  }[answers.budget] || 16000;

  const selected = [];
  let currentTotal = 0;
  for (const product of concernMatches) {
    const price = getDiscountedPrice(product);
    if (selected.find((item) => item.id === product.id)) {
      continue;
    }
    if (currentTotal + price > budgetLimit && selected.length >= 2) {
      continue;
    }
    selected.push(product);
    currentTotal += price;
    if (selected.length === 3) {
      break;
    }
  }

  return selected.slice(0, 3);
}

function buildRoutineMessage(answers) {
  const concernLabel = {
    story: "povesti cinematice si aventura",
    esports: "meciuri competitive si reflexe rapide",
    co_op: "experiente cooperativ-multiplayer",
  }[answers.concern] || "echilibru gameplay";
  const moodLabel = {
    solo: "sesiuni solo focusate",
    ranked: "ranked si progres competitiv",
    chill: "sesiuni chill cu prietenii",
  }[answers.mood] || "sesiuni variate";

  return `Am construit un loadout axat pe ${concernLabel}, optimizat pentru ${moodLabel}, in bugetul ${answers.budget}.`;
}

function resolveBaseUrl(req) {
  const configuredUrl = String(process.env.APP_BASE_URL || "").trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const host = req.get("host");
  return `${req.protocol}://${host}`;
}

module.exports = {
  app,
};
