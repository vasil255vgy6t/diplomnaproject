const express = require("express");
const cors = require("cors");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(publicRoutes);
app.use(adminRoutes);

module.exports = app;
