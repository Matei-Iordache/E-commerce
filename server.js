const { initDb } = require("./src/db");
const { app } = require("./src/app");

initDb();

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`GameGrid ruleaza la http://localhost:${port}`);
});
