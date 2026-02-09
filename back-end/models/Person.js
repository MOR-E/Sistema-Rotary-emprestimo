var knex = require("../database/connection");

class Person {
  // Verifica se o usuário é admin
  async verifyUser(email) {
    try {
      const user = await knex("usuario")
        .select("admin")
        .where({ email })
        .first();
      if (!user) return null;
      return { admin: user.admin === 1 };
    } catch (err) {
      console.error("Erro em verifyUser:", err);
      return null;
    }
  }

  async findAll(search, email) {
    try {
      const user = await this.verifyUser(email);
      if (!user) return [];

      let query = knex
        .select([
          "id",
          "nome",
          "telefone1",
          "telefone2",
          "cep",
          "rua",
          "bairro",
          "complemento",
          "numero",
          "cpf",
          "rg",
          "situacao",
        ])
        .from("pessoa");

      if (!user.admin) {
        query = query.where("situacao", 1);
      }

      if (search) {
        const trimmedSearch = search.trim();
        const numericOnly = trimmedSearch.replace(/\D/g, "");

        const isCpf = numericOnly.length === 11;
        const isId = /^\d+$/.test(trimmedSearch) && numericOnly.length < 11;

        query = query.andWhere(function () {
          if (isCpf) {
            // Remove pontos e traços do campo CPF no banco na hora da comparação
            this.whereRaw(
              `REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') LIKE ?`,
              [`%${numericOnly}%`]
            );
          } else if (isId) {
            this.where("id", parseInt(trimmedSearch));
          } else {
            this.where("nome", "like", `%${trimmedSearch}%`);
          }
        });
      }

      return await query;
    } catch (err) {
      console.error("Erro em findAll (Pessoa):", err);
      return [];
    }
  }

  async findById(id, email) {
    try {
      // 1) Verifica privilégio do usuário
      const user = await this.verifyUser(email);
      if (!user) {
        // Usuário não encontrado ou erro de verificação
        return undefined;
      }

      // 2) Monta query base
      let query = knex("pessoa")
        .select([
          "id",
          "nome",
          "telefone1",
          "telefone2",
          "cep",
          "rua",
          "bairro",
          "complemento",
          "numero",
          "cpf",
          "rg",
          "situacao",
        ])
        .where({ id });

      // 3) Se não for admin, filtra apenas registros ativos
      if (!user.admin) {
        query = query.andWhere({ situacao: 1 });
      }

      const result = await query;

      return result.length > 0 ? result[0] : undefined;
    } catch (err) {
      console.error("Erro em findById (Pessoa):", err);
      return undefined;
    }
  }

  async findByName(name) {
    try {
      var result = await knex
        .select([
          "id",
          "nome",
          "telefone1",
          "telefone2",
          "cep",
          "rua",
          "bairro",
          "complemento",
          "numero",
          "cpf",
          "rg",
          "situacao",
        ])
        .where({ name: name })
        .table("pessoa");

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

  async new(
    nome,
    telefone1,
    telefone2,
    cep,
    rua,
    bairro,
    complemento,
    numero,
    cpf,
    rg,
    tokenEmail
  ) {
    try {
      // Insere pessoa
      await knex("pessoa").insert({
        nome,
        telefone1,
        telefone2,
        cep,
        rua,
        bairro,
        complemento,
        numero,
        cpf,
        rg,
        situacao: true,
      });

      // Verifica se o usuário é admin
      const user = await this.verifyUser(tokenEmail);
      const isAdmin = user && user.admin;

      // Seleciona as pessoas conforme permissão
      const pessoas = await knex("pessoa")
        .select([
          "id",
          "nome",
          "telefone1",
          "telefone2",
          "cep",
          "rua",
          "bairro",
          "complemento",
          "numero",
          "cpf",
          "rg",
          "situacao",
        ])
        .where(function () {
          if (!isAdmin) {
            this.where("situacao", true);
          }
        });

      return pessoas;
    } catch (err) {
      console.error("Erro no método Person.new:", err);
      throw err;
    }
  }

  async findName(name) {
    try {
      var result = await knex.select("*").from("pessoa").where({ name: name });

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

  async findCPF(cpf) {
    try {
      var result = await knex.select("*").from("pessoa").where({ cpf: cpf });

      if (result.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async findRG(rg) {
    try {
      var result = await knex.select("*").from("pessoa").where({ rg: rg });

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

  async update(
    email,
    id,
    nome,
    telefone1,
    telefone2,
    cep,
    rua,
    bairro,
    complemento,
    numero,
    cpf,
    rg,
    situacao
  ) {
    const person = await this.findById(id, email);
    if (!person) {
      return { status: false, err: "A pessoa não existe" };
    }

    const user = await this.verifyUser(email);
    const isAdmin = user && user.admin;

    const editPerson = {};

    if (cpf !== undefined && cpf !== person.cpf) {
      const result = await this.findCPF(cpf);
      if (!result) {
        editPerson.cpf = cpf;
      } else {
        return { status: false, err: "CPF já cadastrado" };
      }
    }

    if (rg !== undefined && rg !== person.rg) {
      const result = await this.findRG(rg);
      if (!result) {
        editPerson.rg = rg;
      } else {
        return { status: false, err: "RG já cadastrado" };
      }
    }

    if (nome !== undefined) editPerson.nome = nome;
    if (telefone1 !== undefined) editPerson.telefone1 = telefone1;
    if (telefone2 !== undefined) editPerson.telefone2 = telefone2;
    if (cep !== undefined) editPerson.cep = cep;
    if (rua !== undefined) editPerson.rua = rua;
    if (bairro !== undefined) editPerson.bairro = bairro;
    if (complemento !== undefined) editPerson.complemento = complemento;
    if (numero !== undefined) editPerson.numero = numero;

    if (situacao !== undefined) {
      editPerson.situacao =
        situacao === true ||
        situacao === "true" ||
        situacao === 1 ||
        situacao === "1";
    }

    try {
      await knex("pessoa").where({ id }).update(editPerson);

      const pessoas = await knex("pessoa")
        .select([
          "id",
          "nome",
          "telefone1",
          "telefone2",
          "cep",
          "rua",
          "bairro",
          "complemento",
          "numero",
          "cpf",
          "rg",
          "situacao",
        ])
        .where(function () {
          if (!isAdmin) {
            this.where("situacao", true);
          }
        });

      return { status: true, pessoas };
    } catch (err) {
      return { status: false, err: err.message || err };
    }
  }
}

module.exports = new Person();
