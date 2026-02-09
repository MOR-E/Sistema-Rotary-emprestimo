// app.js
var express = require("express");
var cors = require("cors");
var router = require("./routes/routes");

var app = express();

// ======================
// CONFIGURAÇÃO DE CORS
// ======================
app.use(
  cors({
    origin: ["http://localhost:5173"], // front-end Vite
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // permite bearer token
  })
);

// ======================
// PARSE DE JSON NATIVO
// ======================
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ======================
// ROTAS
// ======================
app.use("/", router);

// Exporta o app (servidor será criado em outro arquivo, ex: server.js)
module.exports = app;
