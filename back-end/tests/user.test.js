const request = require("supertest");
const app = require("../app");

// Mock das dependências externas
jest.mock("../models/User.js");
jest.mock("../models/PasswordToken.js");
jest.mock("bcrypt");
jest.mock("../mailer/transporter.js");
jest.mock("knex", () => {
  const mockUpdate = jest.fn().mockResolvedValue(1);
  const mockWhere = jest.fn(() => ({
    update: mockUpdate,
  }));

  const mockKnex = jest.fn(() => ({
    where: mockWhere,
  }));

  mockKnex.mockWhere = mockWhere;
  mockKnex.mockUpdate = mockUpdate;

  return mockKnex;
});
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));
jest.mock("../database/connection", () => {
  const mockUpdate = jest.fn().mockResolvedValue(1);
  const mockWhere = jest.fn(() => ({
    update: mockUpdate,
  }));

  const mockKnex = jest.fn(() => ({
    where: mockWhere,
  }));

  mockKnex.mockWhere = mockWhere;
  mockKnex.mockUpdate = mockUpdate;

  return mockKnex;
});

const User = require("../models/User.js");
const PasswordToken = require("../models/PasswordToken.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../mailer/transporter.js");

describe("Teste de funcionalidades de usuário (login, recuperação e mudança de senha)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Testes de login
  describe("Teste de login", () => {
    test("Deve autenticar e retornar o token quando as credenciais estiverem corretas", async () => {
      const email = "usuario@example.com";
      const senha = "senha123";
      const fakeUser = {
        id: 1,
        nome: "Usuário Teste",
        telefone: "12345678",
        email,
        senha: "hashedPassword",
        admin: 1,
        situacao: 1,
      };

      User.verifySituation.mockResolvedValue({ exists: true, situacao: true });
      User.findByEmail.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fake-jwt-token");

      const res = await request(app).post("/login").send({ email, senha });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ status: true, token: "fake-jwt-token" });
    });

    test("Deve retornar 401 quando as credenciais estiverem incorretas", async () => {
      User.verifySituation.mockResolvedValue({
        exists: false,
        situacao: false,
      });

      const res = await request(app).post("/login").send({
        email: "usuario-nao-existe@example.com",
        senha: "senhaerrada",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        status: false,
        message: "Credenciais inválidas.",
      });
    });

    test("Deve lidar com erros inesperados e retornar 500", async () => {
      User.verifySituation.mockImplementation(() => {
        throw new Error("Erro inesperado");
      });

      const res = await request(app).post("/login").send({
        email: "usuario@example.com",
        senha: "senha123",
      });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({
        status: false,
        message: "Erro interno no servidor.",
      });
    });
  });

  // Testes de recuperação de senha
  describe("Teste de recuperação de senha", () => {
    test("Deve retornar 404 se o usuário não for encontrado", async () => {
      User.findByEmail.mockResolvedValue(undefined);

      const res = await request(app)
        .post("/recoverpassword")
        .send({ email: "naoexiste@teste.com" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: "Usuário não encontrado" });
    });

    test("Deve enviar o e-mail de recuperação com sucesso", async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: "teste@teste.com" });
      PasswordToken.mockImplementation(() => ({
        create: jest.fn().mockResolvedValue({ token: "token123" }),
      }));
      transporter.sendMail.mockResolvedValue(true);

      const res = await request(app)
        .post("/recoverpassword")
        .send({ email: "teste@teste.com" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "E-mail de recuperação enviado" });
    });

    test("Deve retornar erro ao tentar enviar o e-mail", async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: "teste@teste.com" });
      PasswordToken.mockImplementation(() => ({
        create: jest.fn().mockResolvedValue({ token: "token123" }),
      }));
      transporter.sendMail.mockRejectedValue(new Error("Falha no envio"));

      const res = await request(app)
        .post("/recoverpassword")
        .send({ email: "teste@teste.com" });

      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ error: "Erro ao tentar enviar o email" });
    });
  });

  // Testes de mudança de senha
  describe("Teste de mudança de senha", () => {
    test("Deve retornar erro 400 para token inválido", async () => {
      PasswordToken.validate.mockResolvedValue({ status: false });

      const res = await request(app)
        .post("/changepassword")
        .send({ token: "token-invalido", senha: "novaSenha" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: "Token inválido ou expirado" });
    });

    test("Deve trocar a senha com sucesso", async () => {
      PasswordToken.validate.mockResolvedValue({
        status: true,
        user: { id: 1 },
      });
      bcrypt.hash.mockResolvedValue("hashedPassword");
      PasswordToken.invalidate.mockResolvedValue();

      const res = await request(app)
        .post("/changepassword")
        .send({ token: "token-valido", senha: "novaSenha" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Senha atualizada com sucesso" });
    });
  });
});
