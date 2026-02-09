var knex = require("../database/connection");
var bcrypt = require("bcrypt");
const PasswordToken = require("./PasswordToken");

class User {
  async verifyUser(email) {
    try {
      const user = await knex("usuario")
        .select("id", "admin")
        .where({ email })
        .first();

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        admin: user.admin === 1, // garante boolean
      };
    } catch (error) {
      console.error("Erro em verifyUser:", error);
      return null;
    }
  }

  async findAll(search, email) {
    try {
      // 1) Verifica usuário e privilégio
      const user = await this.verifyUser(email);
      if (!user) {
        return { status: false, err: "Usuário não encontrado." };
      }

      // 2) Restringe acesso apenas a administradores
      if (!user.admin) {
        return {
          status: false,
          err: "Usuário não tem permissão para acessar esta lista.",
        };
      }

      // 3) Inicia a query base
      let query = knex
        .select(["id", "nome", "telefone", "email", "admin", "situacao"])
        .from("usuario");

      // 4) Se veio parâmetro de busca, aplica filtro por nome ou id
      if (search) {
        const trimmed = search.trim();
        const isNumeric = /^\d+$/.test(trimmed);

        query = query.where(function () {
          this.where("nome", "like", `%${trimmed}%`);
          if (isNumeric) {
            this.orWhere("id", parseInt(trimmed, 10));
          }
        });
      }

      // 5) Executa e retorna resultado
      const result = await query;
      return { status: true, usuarios: result };
    } catch (err) {
      console.error("Erro em findAll:", err);
      return { status: false, err: "Erro interno ao buscar usuários." };
    }
  }

  async findById(id) {
    try {
      var result = await knex
        .select(["id", "nome", "telefone", "email", "admin", "situacao"])
        .where({ id: id })
        .table("usuario");

      if (result.length > 0) {
        return result[0];
      } else {
        return undefined;
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async findByEmail(email) {
    try {
      var result = await knex
        .select([
          "id",
          "nome",
          "telefone",
          "email",
          "senha",
          "admin",
          "situacao",
        ])
        .where({ email: email })
        .table("usuario");

      if (result.length > 0) {
        return result[0];
      } else {
        return undefined;
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async new(nome, telefone, email, senha, admin, emailCriador) {
    // 0) Verifica se o criador é admin
    const criador = await this.verifyUser(emailCriador);
    if (!criador || !criador.admin) {
      throw new Error("Apenas administradores podem criar novos usuários.");
    }

    // 1) Criptografa a senha
    const hash = await bcrypt.hash(senha, 10);

    // 2) Define flag de admin (default false)
    const isAdmin =
      admin === true || admin === "true" || admin === 1 || admin === "1";

    // 3) Insere o novo usuário como ativo (admin vira 0 ou 1)
    await knex("usuario").insert({
      nome,
      telefone,
      email,
      senha: hash,
      admin: isAdmin ? 1 : 0,
      situacao: true,
    });

    // 4) Retorna todos os usuários ativos
    const ativos = await knex("usuario")
      .select(["id", "nome", "telefone", "email", "admin"])
      .where("situacao", true);

    return ativos;
  }

  async findEmail(email) {
    try {
      var result = await knex
        .select("*")
        .from("usuario")
        .where({ email: email });

      if (result.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async update(id, nome, telefone, novoEmail, admin, situacao, tokenEmail) {
    const user = await this.findById(id);
    if (!user) {
      return { status: false, err: "O usuário não existe" };
    }

    const tokenUser = await this.verifyUser(tokenEmail);
    if (!tokenUser) {
      return { status: false, err: "Token inválido ou usuário não encontrado" };
    }

    if (!tokenUser.admin && tokenUser.id !== user.id) {
      return {
        status: false,
        err: "Usuário não autorizado a editar este registro",
      };
    }

    if (!tokenUser.admin) {
      if (admin !== undefined) {
        return {
          status: false,
          err: "Usuário não tem permissão para alterar campo admin",
        };
      }
      if (situacao !== undefined) {
        return {
          status: false,
          err: "Usuário não tem permissão para alterar campo situacao",
        };
      }
    }

    const editUser = {};

    if (novoEmail !== undefined && novoEmail !== user.email) {
      const exists = await this.findEmail(novoEmail);
      if (exists) {
        return { status: false, err: "E-mail já cadastrado" };
      }
      editUser.email = novoEmail;
    }

    if (nome !== undefined) {
      editUser.nome = nome;
    }

    if (telefone !== undefined) {
      editUser.telefone = telefone;
    }

    if (admin !== undefined) {
      editUser.admin =
        admin === true || admin === "true" || admin === 1 || admin === "1";
    }

    if (situacao !== undefined) {
      editUser.situacao =
        situacao === true ||
        situacao === "true" ||
        situacao === 1 ||
        situacao === "1";
    }

    try {
      await knex("usuario").where({ id }).update(editUser);

      // Pega os usuários ativos após atualização
      const ativos = await knex("usuario")
        .select(["id", "nome", "telefone", "email", "admin"])
        .where("situacao", true);

      return { status: true, usuarios: ativos };
    } catch (error) {
      return { status: false, err: error };
    }
  }

  async changePassword(newPassword, id, token) {
    var hash = await bcrypt.hash(newPassword, 10);
    await knex.update({ password: hash }).where({ id: id }).table("users");

    await PasswordToken.setUsed(token);
  }

  async verifySituation(email) {
    try {
      const user = await knex("usuario").where({ email }).first();

      if (!user) {
        return { exists: false, situacao: false };
      }

      return { exists: true, situacao: user.situacao === 1 };
    } catch (err) {
      console.error("Erro ao verificar situação do usuário:", err);
      return { exists: false, situacao: false };
    }
  }
}

module.exports = new User();
