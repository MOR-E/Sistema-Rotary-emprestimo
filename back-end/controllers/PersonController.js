var Person = require("../models/Person");

class PersonController {
  async index(req, res) {
    // Captura o parâmetro de busca (pode vir via ?search=pedro)
    const { search } = req.query;
    const { email } = req.body;
    // Chama o model passando o filtro (undefined para sem filtro)
    const persons = await Person.findAll(search, email);

    // Retorna o JSON dos usuários (filtrados ou não)
    res.json(persons);
  }

  async findPerson(req, res) {
    var id = req.params.id;
    var { email } = req.body;
    var person = await Person.findById(id, email);
    if (person == undefined) {
      res.status(404);
      res.json({});
    } else {
      res.status(200);
      res.json(person);
    }
  }

  async create(req, res) {
    const {
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
    } = req.body;

    const tokenEmail = req.user?.email;

    try {
      const cpfExists = await Person.findCPF(cpf);
      if (cpfExists) {
        return res.status(406).json({ err: "A pessoa já está cadastrada!" });
      }

      const pessoas = await Person.new(
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
      );

      return res.status(201).json({
        status: true,
        pessoas,
      });
    } catch (error) {
      console.error("Erro ao criar pessoa:", error);
      return res
        .status(500)
        .json({ error: "Erro interno ao cadastrar pessoa." });
    }
  }

  async edit(req, res) {
    const tokenEmail = req.user?.email;

    const { id } = req.query;

    const {
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
      situacao,
    } = req.body;

    const result = await Person.update(
      tokenEmail,
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
    );

    if (result) {
      if (result.status) {
        return res.status(200).json({
          status: true,
          pessoas: result.pessoas,
        });
      } else {
        return res.status(406).json({ error: result.err });
      }
    } else {
      return res.status(500).json({ error: "Ocorreu um erro no servidor!" });
    }
  }
}

module.exports = new PersonController();
