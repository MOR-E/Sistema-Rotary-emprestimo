var Lending = require("../models/Lending");
var Item = require("../models/Item");

class LendingController {
  async index(req, res) {
    // Captura filtros nomeados na query string
    const { usuario, pessoa, patrimonio } = req.query;
    const { email } = req.body;

    // Chama o model passando os filtros e o email
    const itens = await Lending.findAll({ usuario, pessoa, patrimonio }, email);

    // Retorna o JSON dos empréstimos filtrados
    res.json(itens);
  }

  async findLending(req, res) {
    var id = req.params.id;
    const { email } = req.body;
    var lending = await Lending.findById(id, email);
    if (lending == undefined) {
      res.status(404);
      res.json({});
    } else {
      res.status(200);
      res.json(lending);
    }
  }

  async createLending(req, res) {
    const {
      dataEmprestimo,
      pessoaId,
      email, // agora recebemos email em vez de requisitanteId
      itens,
      motivoEmprestimo, // novo campo opcional
    } = req.body;

    // 1) Validações básicas
    if (
      !dataEmprestimo ||
      !pessoaId ||
      !email ||
      !Array.isArray(itens) ||
      itens.length === 0
    ) {
      return res.status(400).json({
        err: "Informe todos os dados obrigatórios: dataEmprestimo, pessoaId, email do requisitante e ao menos um item.",
      });
    }

    // 2) Verifica pessoa
    const pessoaExists = await Lending.findPessoa(pessoaId);
    if (!pessoaExists) {
      return res.status(406).json({ err: "Essa pessoa não existe." });
    }
    const pessoaSituation = await Lending.verifyPessoaSituation(pessoaId);
    if (!pessoaSituation.situacao) {
      return res.status(406).json({ err: "Essa pessoa está inativa." });
    }

    // 3) Requisitante
    const requisitante = await Lending.findRequisitante({ email });
    if (!requisitante?.id) {
      return res.status(406).json({ err: "Requisitante não encontrado." });
    }
    const requisitanteId = requisitante.id;

    // 4) Verifica situação e disponibilidade dos itens
    const sitCheck = await Lending.verifyItensPatrimonySituacao(itens);
    if (!sitCheck.status) {
      return res.status(406).json({ err: sitCheck.message });
    }
    const dispCheck = await Lending.verifyItensDisponibilidade(itens);
    if (!dispCheck.valid) {
      return res.status(406).json({ err: dispCheck.message });
    }

    // 5) Cria empréstimo
    const result = await Lending.new(
      dataEmprestimo,
      pessoaId,
      requisitanteId,
      itens,
      motivoEmprestimo || ""
    );

    if (!result?.status) {
      return res
        .status(500)
        .json({ err: result.err || "Erro ao criar empréstimo." });
    }

    // 6) Atualiza totais
    const patrimonyIds = itens.map((i) => i.id_item_patrimonio);
    await Item.updateItemTotalsByPatrimonyIds(patrimonyIds);

    // 7) Retorna mensagem, dados do empréstimo e lista de itens
    return res.status(201).json({
      status: true,
      message: "Empréstimo criado com sucesso.",
      emprestimo: result.emprestimo,
      itens: result.itens,
    });
  }

  async createReturn(req, res) {
    try {
      const { dataDevolucao, email, itens } = req.body;
      const emprestimoId = req.query.id;

      // 1) Validação básica
      if (
        !emprestimoId ||
        !dataDevolucao ||
        !email ||
        !Array.isArray(itens) ||
        itens.length === 0
      ) {
        return res.status(400).json({
          err: "Informe id (query), dataDevolucao, email do usuário e lista de itens.",
        });
      }

      // 2) Existência de cada patrimônio
      const existencia = await Lending.validateItensPatrimonyExistence(itens);
      if (!existencia.valid) {
        return res.status(404).json({ err: existencia.message });
      }

      // 3) Busca usuário de devolução
      const usuario = await Lending.findRequisitante({ email });
      if (!usuario?.id) {
        return res
          .status(406)
          .json({ err: "Usuário que recebeu a devolução não encontrado." });
      }
      const usuarioDevolucaoId = usuario.id;

      // 4) IDs dos patrimônios
      const patrimonyIds = itens.map((i) => i.id_item_patrimonio);

      // 5) Executa a devolução
      const result = await Lending.newReturn(
        emprestimoId,
        dataDevolucao,
        usuarioDevolucaoId,
        patrimonyIds
      );

      if (!result?.status) {
        return res
          .status(406)
          .json({ err: result.err || "Ocorreu um erro no servidor!" });
      }

      // 6) Atualiza totais
      await Item.updateItemTotalsByPatrimonyIds(patrimonyIds);

      // 7) Retorna objeto com empréstimo + todos os itens (id + valorEmprestimo)
      return res.status(200).json({
        status: true,
        message: "Devolução registrada com sucesso.",
        emprestimo: result.emprestimo,
        itens: result.itens,
      });
    } catch (err) {
      console.error("Erro inesperado em createReturn:", err);
      return res.status(500).json({ err: "Erro interno do servidor." });
    }
  }

  async edit(req, res) {
    try {
      // 1) Captura id e patrimônios antigos via query
      const { id, patrimonios } = req.query;
      const emprestimoId = parseInt(id, 10);
      if (isNaN(emprestimoId)) {
        return res.status(400).json({ err: "ID inválido na query." });
      }

      const oldPatrimonyIds = (patrimonios || "")
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (oldPatrimonyIds.length === 0) {
        return res
          .status(400)
          .json({ err: "Nenhum patrimônio antigo informado na query." });
      }

      // 2) Campos do body
      const { pessoaId, situacao, itens: novosItens, email } = req.body;
      if (!Array.isArray(novosItens) || novosItens.length === 0) {
        return res
          .status(400)
          .json({ err: "Nenhum item novo fornecido para atualização." });
      }
      if (novosItens.length !== oldPatrimonyIds.length) {
        return res.status(400).json({
          err: "Quantidade de novos itens difere dos patrimônios antigos.",
        });
      }

      // 3) Permissão
      await Lending.verifyUserEdition(email, emprestimoId);

      // 4) Chama o update e retorna empréstimo + itens
      const result = await Lending.update(
        emprestimoId,
        pessoaId,
        situacao,
        novosItens,
        email,
        oldPatrimonyIds
      );

      if (result.status) {
        return res.status(200).json({
          status: true,
          emprestimo: result.emprestimo,
          itens: result.itens,
        });
      } else {
        return res.status(result.statusCode || 406).json({ err: result.err });
      }
    } catch (error) {
      console.error("Erro ao editar empréstimo:", error);
      return res.status(error.status || 500).json({ err: error.message });
    }
  }

  async addItemToAnExistingLoan(req, res) {
    try {
      // 1) Recebe emprestimoId por query `?id=`
      const emprestimoId = req.query.id;
      const { itens } = req.body;
      const email = req.user.email;

      if (!emprestimoId) {
        return res
          .status(400)
          .json({ err: "ID do empréstimo é obrigatório na query." });
      }

      // 2) Verifica status do empréstimo
      const statusOk = await Lending.verificarStatusEmprestimo(emprestimoId);
      if (!statusOk) {
        return res.status(406).json({
          err: "Não é possível adicionar itens a um empréstimo já concluído ou inexistente.",
        });
      }

      // 3) Valida permissão do usuário
      let userEdit;
      try {
        userEdit = await Lending.verifyUserEdition(email, emprestimoId);
      } catch (err) {
        return res.status(err.status || 403).json({ err: err.message });
      }

      // 4) Valida array de itens
      if (!Array.isArray(itens) || itens.length === 0) {
        return res
          .status(400)
          .json({ err: "Informe ao menos um item para adicionar." });
      }

      // 5) Disponibilidade
      const disponibilidade = await Lending.verifyItensDisponibilidade(itens);
      if (!disponibilidade.valid) {
        return res.status(406).json({ err: disponibilidade.message });
      }

      // 6) Situação
      const situacaoCheck = await Lending.verifyItensPatrimonySituacao(itens);
      if (!situacaoCheck.status) {
        return res.status(406).json({ err: situacaoCheck.message });
      }

      // 7) Inserção
      const patrimonyIds = itens.map((i) => i.id_item_patrimonio);
      const resultado = await Lending.addItem(
        emprestimoId,
        patrimonyIds,
        userEdit.id
      );

      if (!resultado || !resultado.status) {
        return res
          .status(406)
          .json({ err: resultado?.err || "Erro ao adicionar item." });
      }

      // 8) Atualiza totais
      await Item.updateItemTotalsByPatrimonyIds(patrimonyIds);

      // 9) Responde com empréstimo e todos os itens dele
      return res.status(201).json({
        status: true,
        message: "Item(s) adicionados ao empréstimo com sucesso.",
        emprestimo: resultado.emprestimo,
        itens: resultado.itens,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ err: "Erro interno do servidor." });
    }
  }
}

module.exports = new LendingController();
