var Item = require("../models/Item");

class ItemController {
  async index(req, res) {
    // Captura o parâmetro de busca (pode vir via ?search=pedro)
    const { search } = req.query;
    const { email } = req.body;
    // Chama o model passando o filtro (undefined para sem filtro)
    const itens = await Item.findAll(search, email);

    // Retorna o JSON dos usuários (filtrados ou não)
    res.json(itens);
  }

  async findItem(req, res) {
    var id = req.params.id;
    var { email } = req.body;
    var item = await Item.findItemById(id, email);
    if (item == undefined) {
      res.status(404);
      res.json({});
    } else {
      res.status(200);
      res.json(item);
    }
  }

  async findItemPatrimony(req, res) {
    var { id } = req.query;
    var { email } = req.body;

    var item = await Item.findAllItemsPatrimonyById(id, email);
    if (item == undefined) {
      res.status(404);
      res.json({});
    } else {
      res.status(200);
      res.json(item);
    }
  }

  async create(req, res) {
    const { nome, descricao } = req.body;

    // validação básica
    if (!nome) {
      return res.status(400).json({
        err: "Informe o nome do item.",
      });
    }

    try {
      // chama o model.new, que já insere e retorna os itens ativos
      const ativos = await Item.new(nome, descricao);

      // retorna 201 Created com o array de itens ativos
      return res.status(201).json({
        status: true,
        itens: ativos,
      });
    } catch (error) {
      console.error("Erro ao criar item:", error);
      return res.status(500).json({
        err: "Erro interno ao cadastrar item.",
      });
    }
  }

  async createItemPatrimonio(req, res) {
    const { id_item } = req.query;
    const { patrimonio, email } = req.body;

    // 1) Verifica se o item existe
    const itemExists = await Item.findItemById(id_item, email);
    if (!itemExists) {
      return res.status(406).json({ err: "Esse item não existe" });
    }

    // 2) Verifica se o patrimônio foi informado
    if (!patrimonio) {
      return res.status(400).json({ err: "Informe o patrimônio" });
    }

    try {
      // 3) Insere o novo patrimônio e obtém a lista atualizada de ativos
      const ativos = await Item.newItemPatrimonio(id_item, patrimonio);

      // 4) Atualiza totais no modelo
      await Item.updateItemTotals([id_item]);

      // 5) Retorna 201 com todos os itens de patrimônio ativos
      return res.status(201).json({
        status: true,
        itens: ativos,
      });
    } catch (error) {
      console.error("Erro ao criar item_patrimonio:", error);

      if (error.status) {
        return res.status(error.status).json({ err: error.message });
      }

      return res.status(500).json({ err: "Erro interno no servidor" });
    }
  }

  async edit(req, res) {
    const { nome, descricao, situacao, email } = req.body;
    const { id } = req.query;

    const result = await Item.update(id, nome, descricao, situacao, email);

    if (result !== undefined) {
      if (result.status) {
        return res.status(200).json({
          msg: result.msg || "Item atualizado com sucesso.",
          itens: result.itens || [],
        });
      } else {
        return res.status(result.code || 406).json({
          err: result.err || "Erro ao atualizar item.",
        });
      }
    } else {
      return res.status(500).json({ err: "Ocorreu um erro no servidor!" });
    }
  }

  async editItemPatrimony(req, res) {
    const { patrimonio, situacao, email } = req.body;
    const { id } = req.query;

    const result = await Item.updateItemPatrimony(
      id,
      patrimonio,
      situacao,
      email
    );

    if (result !== undefined) {
      if (result.status) {
        // Atualiza totais do item
        await Item.updateItemTotalsByPatrimonyIds(id);

        // Retorna itens atualizados
        return res.status(200).json({
          msg: "Item de patrimônio atualizado com sucesso.",
          itens: result.itens || [],
        });
      } else {
        return res.status(406).json({ err: result.err });
      }
    } else {
      return res.status(500).json({ err: "Ocorreu um erro no servidor!" });
    }
  }
}

module.exports = new ItemController();
