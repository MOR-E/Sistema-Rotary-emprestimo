const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const inactivityLimitMs = 2 * 60 * 60 * 1000; // 2 horas
// const inactivityLimitMs = 1 * 60 * 1000; // 1 minuto

function accessTimer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({
      error: true,
      message: "Você não está autenticado",
    });
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, secret);

    const lastAccessTime = decoded.lastAccess
      ? new Date(decoded.lastAccess)
      : new Date(decoded.iat * 1000);

    const now = new Date();
    const elapsedMs = now - lastAccessTime;

    if (elapsedMs > inactivityLimitMs) {
      return res.status(401).json({
        error: true,
        message:
          "Você foi desconectado por inatividade. Por favor, faça login novamente.",
      });
    }

    const payload = {
      email: decoded.email,
      admin: decoded.admin,
      lastAccess: now.toISOString(),
    };

    const newToken = jwt.sign(payload, secret);
    res.setHeader("authorization", `Bearer ${newToken}`);

    req.user = payload;

    next();
  } catch (err) {
    return res.status(403).json({
      error: true,
      message: "Você não está autenticado",
      details: err.message,
    });
  }
}

function injectEmail(req, res, next) {
  if (!req.user || !req.user.email) {
    return res.status(400).json({
      error: true,
      message: "Não foi possível obter o email do usuário.",
    });
  }

  req.body = req.body || {};
  req.body.email = req.user.email;
  next();
}

function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(403).json({
      error: true,
      message: "Você não está autenticado",
    });
  }

  if (req.user.admin === 1) {
    return next();
  }

  return res.status(403).json({
    error: true,
    message: "Você não tem permissão!!",
  });
}

module.exports = {
  accessTimer,
  injectEmail,
  verifyAdmin,
};
