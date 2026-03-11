const app = require("./src/app");
const { PORT } = require("./src/config/env");
const { initializeDatabase } = require("./src/db/init");

try {
    initializeDatabase();
} catch (error) {
    console.error("Не вдалося ініціалізувати SQLite:", error);
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});
