require("dotenv").config();

module.exports = {
    PORT: Number(process.env.PORT) || 3000,
    DB_PATH: process.env.DB_PATH || "data/mental_health.sqlite",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "admin@college.local",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
};
