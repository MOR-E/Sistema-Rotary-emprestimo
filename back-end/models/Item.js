var knex = require("../database/connection");

class Item {
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
      // 1) Verifica privilégio do usuário
      const user = await this.verifyUser(email);
      if (!user) {
        return [];
      }

      // 2) Monta consulta de itens
      let query = knex
        .select([
          "id",
          "nome",
          "descricao",
          "total",
          "total_disponivel",
          "situacao",
        ])
        .from("item");

      // 3) Se não for admin, filtra apenas itens ativos
      if (!user.admin) {
        query = query.where("situacao", 1);
      }

      // 4) Aplica filtro de busca se fornecido
      if (search) {
        const searchIsNumeric = /^\d+$/.test(search);
        query = query.andWhere(function () {
          if (searchIsNumeric) {
            this.where("id", parseInt(search, 10));
          } else {
            this.where("nome", "like", `%${search}%`);
          }
        });
      }

      // 5) Executa consulta de itens
      const itens = await query;

      // 6) Busca todos os patrimônios relacionados aos itens encontrados
      const itemIds = itens.map((item) => item.id);
      const patrimonios = await knex("item_patrimonio")
        .select("id", "id_item as itemId", "patrimonio", "emprestado", "situacao")
        .whereIn("id_item", itemIds);

      // 7) Agrupa patrimônios por item e calcula totais
      const patrByItem = {};
      const totalsByItem = {};
      const disponiveisByItem = {};
      
      for (const p of patrimonios) {
        if (!patrByItem[p.itemId]) {
          patrByItem[p.itemId] = [];
          totalsByItem[p.itemId] = 0;
          disponiveisByItem[p.itemId] = 0;
        }
        patrByItem[p.itemId].push({
          id: p.id,
          patrimonio: p.patrimonio,
          emprestado: p.emprestado,
          situacao: p.situacao,
        });
        
        // Conta patrimônios ativos
        if (p.situacao === 1 || p.situacao === true) {
          totalsByItem[p.itemId]++;
          // Conta patrimônios disponíveis (ativos e não emprestados)
          if (p.emprestado === 0 || p.emprestado === false) {
            disponiveisByItem[p.itemId]++;
          }
        }
      }

      // 8) Anexa o array de patrimônios em cada item com totais calculados
      const result = itens.map((item) => ({
        ...item,
        total: totalsByItem[item.id] || 0,
        disponiveis: disponiveisByItem[item.id] || 0,
        patrimonios: patrByItem[item.id] || [],
      }));

      return result;
    } catch (err) {
      console.error("Erro em findAll:", err);
      return [];
    }
  }

  async findItemById(id, email) {
    try {
      // 1) Verifica usuário e privilégio
      const user = await this.verifyUser(email);
      if (!user) {
        return undefined; // ou lançar erro de permissão
      }

      // 2) Monta query base incluindo situacao
      let query = knex("item")
        .select([
          "id",
          "nome",
          "descricao",
          "total",
          "total_disponivel",
          "situacao",
        ])
        .where({ id });

      // 3) Se não for admin, filtra apenas itens ativos
      if (!user.admin) {
        query = query.andWhere({ situacao: 1 });
      }

      const result = await query;
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Erro em findItemById:", error);
      return undefined;
    }
  }

  async findPatrimonyById(id, email) {
    try {
      // Verifica se o usuário é admin
      const user = await this.verifyUser(email);

      if (!user) {
        return undefined; // ou throw new Error("Usuário não encontrado");
      }

      // Define o filtro de acordo com privilégio
      let query = knex
        .select(["id", "id_item", "patrimonio", "emprestado", "situacao"])
        .from("item_patrimonio")
        .where({ id });

      if (!user.admin) {
        query.andWhere({ situacao: true });
      }

      const result = await query;

      if (result.length > 0) {
        return result[0];
      } else {
        return undefined;
      }
    } catch (error) {
      console.error("Erro em findPatrimonyById:", error);
      return undefined;
    }
  }

  async findAllItemsPatrimonyById(itemId, email) {
    try {
      // 1) Verifica se o usuário existe e se é admin
      const user = await this.verifyUser(email);
      if (!user) {
        return [];
      }

      // 2) Inicia a query na tabela item_patrimonio, com os filtros
      let query = knex("item_patrimonio")
        .select({
          id: "id",
          id_item_patrimonio: "id",
          patrimonio: "patrimonio",
          situacao: "situacao",
          emprestado: "emprestado",
        })
        .where("id_item", itemId);

      // 3) Se o usuário não for admin, retorna apenas patrimônios ativos
      if (!user.admin) {
        query = query.andWhere("situacao", 1);
      }

      // 4) Executa e retorna
      const patrimonios = await query;
      return patrimonios;
    } catch (error) {
      console.error("Erro em findAllItemsPatrimonyById:", error);
      return [];
    }
  }

  async new(nome, descricao) {
    // 1) Insere o novo item, marcando-o como ativo (situacao = true)
    await knex("item").insert({
      nome,
      descricao,
      total: 0,
      total_disponivel: 0,
      situacao: true,
    });

    // 2) Retorna todos os itens cujo campo situacao seja true
    const ativos = await knex("item")
      .select(["id", "nome", "descricao", "total", "total_disponivel"])
      .where("situacao", true);

    return ativos;
  }

  async newItemPatrimonio(id_item, patrimonio) {
    try {
      // 1) Verifica duplicidade de patrimônio
      const existente = await knex("item_patrimonio")
        .where("patrimonio", patrimonio)
        .first();

      if (existente) {
        const err = new Error(
          `O patrimônio "${patrimonio}" já está cadastrado.`
        );
        err.status = 409; // HTTP Conflict
        throw err;
      }

      // 2) Insere o novo patrimônio
      await knex("item_patrimonio").insert({
        id_item,
        patrimonio,
        emprestado: false,
        situacao: true,
      });

      // 3) Busca e retorna apenas os registros ativos (situacao = true),
      //    renomeando o id para id_item_patrimonio
      const ativos = await knex("item_patrimonio")
        .select({
          id_item_patrimonio: "id",
          patrimonio: "patrimonio",
        })
        .where({
          id_item,
          situacao: true,
        });

      return ativos;
    } catch (err) {
      // Propaga erros de conflito ou cria um interno genérico
      if (err.status) throw err;
      const internalErr = new Error("Erro interno ao cadastrar o patrimônio.");
      internalErr.status = 500;
      throw internalErr;
    }
  }

  async findPatrimonio(patrimonio) {
    try {
      var result = await knex
        .select("*")
        .from("item_patrimonio")
        .where({ patrimonio: patrimonio });

      if (result.length > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async update(id, nome, descricao, situacao, email) {
    const user = await this.verifyUser(email);

    if (situacao !== undefined && (!user || user.admin !== true)) {
      return {
        status: false,
        err: "Você não tem permissão para alterar o campo 'situação'.",
      };
    }

    const item = await this.findItemById(id, email);

    if (item !== undefined) {
      try {
        if (situacao === false) {
          const emprestados = await knex("item_patrimonio").where({
            id_item: id,
            emprestado: true,
          });

          if (emprestados.length > 0) {
            return {
              status: false,
              code: 406,
              err: "O item não pode ser inativado, pois possui patrimônios emprestados.",
            };
          }
        }

        const editItem = {};
        if (nome !== undefined) editItem.nome = nome;
        if (descricao !== undefined) editItem.descricao = descricao;
        if (situacao !== undefined) editItem.situacao = situacao;

        await knex("item").update(editItem).where({ id });

        let patrimonioAtualizados = 0;
        if (situacao !== undefined) {
          patrimonioAtualizados = await knex("item_patrimonio")
            .where({ id_item: id })
            .update({ situacao });
        }

        // 🔁 Retorna todos os itens com situação = true
        const itensAtivos = await knex("item")
          .select("id", "nome", "descricao", "total", "total_disponivel")
          .where("situacao", true);

        return {
          status: true,
          patrimonioAtualizados,
          msg: `Item atualizado com sucesso. ${patrimonioAtualizados} patrimônio(s) também tiveram a situação atualizada.`,
          itens: itensAtivos,
        };
      } catch (err) {
        return { status: false, err };
      }
    } else {
      return { status: false, err: "O item não existe" };
    }
  }

  async updateItemPatrimony(id, patrimonio, situacao, email) {
    const user = await this.verifyUser(email);
    if (!user) {
      return { status: false, err: "Usuário não autorizado." };
    }

    if (situacao !== undefined && user.admin !== true) {
      return {
        status: false,
        err: "Você não tem permissão para alterar o campo 'situação'.",
      };
    }

    const item = await this.findPatrimonyById(id, email);
    if (!item) {
      return { status: false, err: "O item não existe." };
    }

    try {
      const result = await knex("item_patrimonio")
        .select("emprestado")
        .where({ id })
        .first();

      if (result && result.emprestado === 1) {
        return {
          status: false,
          err: "Este patrimônio está emprestado e não pode ser inativado.",
        };
      }

      const editItem = {};

      if (patrimonio !== undefined) {
        const existing = await knex("item_patrimonio")
          .where("patrimonio", patrimonio)
          .andWhereNot("id", id)
          .first();

        if (existing) {
          return {
            status: false,
            err: `Já existe um patrimônio com o código '${patrimonio}'.`,
          };
        }

        editItem.patrimonio = patrimonio;
      }

      if (situacao !== undefined) {
        editItem.situacao = situacao;
      }

      await knex("item_patrimonio").update(editItem).where({ id });

      if (patrimonio !== undefined) {
        await knex("emprestimo_item")
          .update({ patrimonio })
          .where({ id_item_patrimonio: id });
      }

      // ✅ Retorna todos os patrimônios ativos do mesmo item
      const ativos = await knex("item_patrimonio")
        .select({ id_item_patrimonio: "id", patrimonio: "patrimonio" })
        .where({ id_item: item.id_item, situacao: true });

      return { status: true, itens: ativos };
    } catch (err) {
      console.error("Erro ao atualizar item de patrimônio:", err);
      return { status: false, err: "Erro ao atualizar o item de patrimônio." };
    }
  }

  async updateItemTotals(itemIds) {
    // garante um array único de IDs
    const uniqueIds = [...new Set(itemIds)];

    for (const id_item of uniqueIds) {
      // 1) total de patrimonios do item
      const [{ count: total }] = await knex("item_patrimonio")
        .count("id as count")
        .where({ id_item: id_item });

      // 2) total disponível (situação = true, emprestado = false)
      const [{ count: total_disponivel }] = await knex("item_patrimonio")
        .count("id as count")
        .where({ id_item: id_item, situacao: 1, emprestado: 0 });

      // 3) atualiza a tabela item
      await knex("item")
        .where({ id: id_item })
        .update({
          total: parseInt(total, 10),
          total_disponivel: parseInt(total_disponivel, 10),
        });
    }
  }

  async updateItemTotalsByPatrimonyIds(itemPatrimonyIds, trx = knex) {
    const uniquePatrimonyIds = Array.isArray(itemPatrimonyIds)
      ? [...new Set(itemPatrimonyIds)]
      : [itemPatrimonyIds];

    if (uniquePatrimonyIds.length === 0) return;

    const rows = await trx("item_patrimonio")
      .distinct("id_item")
      .whereIn("id", uniquePatrimonyIds);

    const uniqueItemIds = rows.map((r) => r.id_item);

    for (const itemId of uniqueItemIds) {
      const [{ count: total }] = await trx("item_patrimonio")
        .count("id as count")
        .where({ id_item: itemId, situacao: 1 });

      const [{ count: total_disponivel }] = await trx("item_patrimonio")
        .count("id as count")
        .where({ id_item: itemId, situacao: 1, emprestado: 0 });

      await trx("item")
        .where({ id: itemId })
        .update({
          total: parseInt(total, 10),
          total_disponivel: parseInt(total_disponivel, 10),
        });
    }
  }

  async updateTotalsBySwap(novosItens, oldPatrimonyIds, trx = knex) {
    const oldIds = Array.isArray(oldPatrimonyIds)
      ? [...new Set(oldPatrimonyIds)]
      : [oldPatrimonyIds];

    const newIds = Array.isArray(novosItens)
      ? [...new Set(novosItens.map((i) => i.id_item_patrimonio))]
      : [];

    if (oldIds.length === 0 && newIds.length === 0) return;

    if (oldIds.length > 0) {
      await trx("item_patrimonio")
        .whereIn("id", oldIds)
        .update({ emprestado: 0 });
    }

    if (newIds.length > 0) {
      await trx("item_patrimonio")
        .whereIn("id", newIds)
        .update({ emprestado: 1 });
    }

    const affectedPatrimonyIds = [...oldIds, ...newIds];
    await this.updateItemTotalsByPatrimonyIds(affectedPatrimonyIds, trx);
  }
}

module.exports = new Item();
