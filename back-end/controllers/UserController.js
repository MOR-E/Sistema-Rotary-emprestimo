var User = require("../models/User");
var PasswordToken = require("../models/PasswordToken");
var jwt = require("jsonwebtoken");
var bcrypt = require("bcrypt");
const transporter = require("../mailer/transporter.js");
var knex = require("../database/connection");
var secret = "segredinho_shiii";
require("dotenv").config();

class UserController {
  async index(req, res) {
    const { search } = req.query;
    const email = req.user?.email;
    const users = await User.findAll(search, email);
    res.json(users);
  }

  async findUser(req, res) {
    var id = req.params.id;
    var user = await User.findById(id);
    if (user == undefined) {
      res.status(404);
      res.json({});
    } else {
      res.status(200);
      res.json(user);
    }
  }

  async create(req, res) {
    const emailCriador = req.user?.email;
    // Se admin não vier no body, assume 0
    const { nome, telefone, email, senha, admin = 0 } = req.body;

    // Checa duplicidade de e‑mail
    const emailExists = await User.findEmail(email);
    if (emailExists) {
      return res.status(409).json({ error: "O e‑mail já está cadastrado!" });
    }

    try {
      // Cria novo usuário
      const ativos = await User.new(
        nome,
        telefone,
        email,
        senha,
        admin,
        emailCriador
      );

      return res.status(201).json({
        status: true,
        usuarios: ativos,
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      const mensagem = error.message || "Erro interno ao cadastrar usuário.";
      const status = mensagem.includes("administradores") ? 403 : 500;
      return res.status(status).json({ error: mensagem });
    }
  }

  async edit(req, res) {
    const { id } = req.query;
    const tokenEmail = req.user.email;
    const { nome, telefone, email, admin, situacao } = req.body;

    const result = await User.update(
      id,
      nome,
      telefone,
      email,
      admin,
      situacao,
      tokenEmail
    );

    if (result) {
      if (result.status) {
        return res.status(200).json({
          status: true,
          usuarios: result.usuarios,
        });
      } else {
        return res.status(406).json({ error: result.err });
      }
    } else {
      return res.status(400).json({ error: "Ocorreu um erro no servidor!" });
    }
  }

  async recoverPassword(req, res) {
    const { email } = req.body;

    // Busca sem revelar se existe ou não
    const user = await User.findByEmail(email);

    // Resposta imediata e igual para todos os cenários
    res.status(200).json({
      message:
        "Caso o seu usuário exista, um link para alteração de senha foi enviado para o email informado.",
    });

    // Se o usuário não existir, finaliza silenciosamente
    if (!user) return;

    // Processa o envio em segundo plano DEPOIS de responder
    setImmediate(async () => {
      try {
        const passwordToken = new PasswordToken();
        const result = await passwordToken.create(user.id);

        const resetUrl = `http://localhost:5173/reset-password?token=${result.token}`;

        await transporter.sendMail({
          from: `"Suporte" <${process.env.MAILER_USER}>`,
          to: email,
          subject: "Recuperação de senha",
          html: `<p>Você solicitou uma recuperação de senha. Clique <a href="${resetUrl}">aqui</a> para redefinir sua senha.</p>`,
        });

        console.log("E-mail enviado com sucesso para:", email);
      } catch (error) {
        // Loga o erro, mas nunca expõe ao cliente
        console.error("Erro ao enviar e-mail de recuperação:", error);
      }
    });
  }

  async changePassword(req, res) {
    const { token, senha } = req.body;
    const isValid = await PasswordToken.validate(token);

    if (!isValid.status) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    await knex("usuario")
      .where({ id: isValid.user.id })
      .update({ senha: hashedPassword });

    await PasswordToken.invalidate(isValid.user.id);

    return res.status(200).json({ message: "Senha atualizada com sucesso" });
  }

  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // 1) Busca o usuário e situação em um só passo
      const situation = await User.verifySituation(email);
      const user = situation.exists ? await User.findByEmail(email) : null;

      // 2) Faz sempre uma comparação de hash para não vazar timing
      const fakeHash = "$2b$10$invalidinvalidinvalidinvalidinvalidinv";
      const hashToCompare = user ? user.senha : fakeHash;
      const senhaOk = await bcrypt.compare(senha, hashToCompare);

      // 3) Verifica todas as condições de falha
      if (
        !user || // usuário não existe
        !situation.exists || // redundante mas claro
        !situation.situacao || // usuário inativo
        !senhaOk // senha incorreta
      ) {
        return res
          .status(401)
          .json({ status: false, message: "Credenciais inválidas." });
      }

      // 4) Sucesso: gera token
      const token = jwt.sign(
        { email: user.email, admin: user.admin === 1 },
        secret,
        { expiresIn: "8h" }
      );

      return res.status(200).json({ 
        status: true, 
        token,
        id: user.id,
        nome: user.nome,
        email: user.email,
        admin: user.admin
      });
    } catch (err) {
      console.error("Erro em login:", err);
      return res
        .status(500)
        .json({ status: false, message: "Erro interno no servidor." });
    }
  }
}

module.exports = new UserController();
