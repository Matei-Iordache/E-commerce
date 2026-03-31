const fs = require("fs");
const path = require("path");
const { initDb } = require("./src/db");

function loadLocalSecrets() {
  const secretPath = path.join(__dirname, "secret", "stripe.env");

  if (!fs.existsSync(secretPath)) {
    return;
  }

  const content = fs.readFileSync(secretPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = value;
  }
}

loadLocalSecrets();

const { app } = require("./src/app");

initDb();

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`GameGrid va rula la http://localhost:${port}`);
});
