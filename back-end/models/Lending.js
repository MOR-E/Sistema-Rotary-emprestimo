var knex = require("../database/connection");
var Item = require("./Item");

class Lending {
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

  async findItem(itemId) {
    return await knex("item").select("id").where({ id: itemId }).first();
  }

  async findAll(filters, email) {
    try {
      const user = await this.verifyUser(email);
      if (!user) return [];

      let query = knex
        .select([
          "emprestimo.id",
          "emprestimo.dataEmprestimo",
          "emprestimo.dataDevolucao",
          "emprestimo.status",
          "emprestimo.pessoaId",
          "emprestimo.requisitanteId",
          "emprestimo.usuarioDevolucaoId",
          "emprestimo.situacao",
        ])
        .from("emprestimo");

      // Se não for admin, só mostra situacao = 1
      if (!user.admin) {
        query.where("emprestimo.situacao", 1);
      }

      // Aplica filtros específicos
      if (filters.pessoa) {
        query.where("emprestimo.pessoaId", filters.pessoa);
      }
      if (filters.usuario) {
        query.where("emprestimo.requisitanteId", filters.usuario);
      }
      if (filters.patrimonio) {
        query.whereIn("emprestimo.id", function () {
          this.select("emprestimoId")
            .from("emprestimo_item")
            .where("patrimonio", "like", `%${filters.patrimonio}%`);
        });
      }

      const emprestimos = await query;
      if (emprestimos.length === 0) return [];

      const emprestimoIds = emprestimos.map((e) => e.id);
      const itens = await knex("emprestimo_item")
        .select([
          "emprestimoId",
          "id_item",
          "id_item_patrimonio",
          "patrimonio",
          "status",
          "pessoaId",
          "requisitanteId",
        ])
        .whereIn("emprestimoId", emprestimoIds);

      const itensPorEmprestimo = {};
      for (const item of itens) {
        if (!itensPorEmprestimo[item.emprestimoId]) {
          itensPorEmprestimo[item.emprestimoId] = [];
        }
        itensPorEmprestimo[item.emprestimoId].push(item);
      }

      return emprestimos.map((e) => ({
        ...e,
        itens: itensPorEmprestimo[e.id] || [],
      }));
    } catch (err) {
      console.error("Erro em findAll (Lending):", err);
      return [];
    }
  }

  async findPessoa(pessoaId) {
    try {
      const result = await knex("pessoa").select("id").where({ id: pessoaId });

      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Erro ao buscar pessoa:", error);
      return undefined;
    }
  }

  async findRequisitante({ email }) {
    try {
      const result = await knex("usuario")
        .select("id")
        .where({ email })
        .first();
      return result || undefined;
    } catch (error) {
      console.error("Erro ao buscar usuario por email:", error);
      return undefined;
    }
  }

  async findUsuarioDevolucao(usuarioId) {
    return await knex("usuario").select("id").where({ id: usuarioId }).first();
  }

  async findById(id, email) {
    try {
      // 1) Verifica usuário e privilégio
      const user = await this.verifyUser(email);
      if (!user) {
        return undefined; // ou lançar erro de permissão
      }

      // 2) Busca os dados principais do empréstimo
      let emprestimoQuery = knex("emprestimo")
        .select([
          "id",
          "dataEmprestimo",
          "dataDevolucao",
          "status",
          "pessoaId",
          "requisitanteId",
          "usuarioDevolucaoId",
          "situacao",
        ])
        .where({ id });

      // Se não for admin, só emprestimos ativos
      if (!user.admin) {
        emprestimoQuery = emprestimoQuery.andWhere({ situacao: 1 });
      }

      const [emprestimo] = await emprestimoQuery;

      if (!emprestimo) {
        return undefined;
      }

      // 3) Busca os itens vinculados a esse empréstimo
      let itensQuery = knex("emprestimo_item")
        .select([
          "id",
          "id_item as id_item",
          "id_item_patrimonio",
          "patrimonio",
          "status",
        ])
        .where({ emprestimoId: id });

      // Se não for admin, só itens ativos
      if (!user.admin) {
        itensQuery = itensQuery.andWhere({ situacao: 1 });
      }

      const itens = await itensQuery;

      // 4) Anexa o array de itens ao JSON retornado
      return {
        ...emprestimo,
        itens,
      };
    } catch (error) {
      console.error("Erro em findById (Lending):", error);
      return undefined;
    }
  }

  async new(dataEmprestimo, pessoaId, requisitanteId, itens, motivoEmprestimo = "") {
    const trx = await knex.transaction();
    try {
      // 1) Insere empréstimo e obtém ID
      const [emprestimoId] = await trx("emprestimo").insert({
        dataEmprestimo,
        status: "pendente",
        pessoaId,
        requisitanteId,
        motivo_emprestimo: motivoEmprestimo,
      });

      // 2) Busca patrimônios
      const patrimonyIds = itens.map((i) => i.id_item_patrimonio);
      const patrimonios = await trx("item_patrimonio")
        .select("id as id_item_patrimonio", "id_item", "patrimonio")
        .whereIn("id", patrimonyIds);

      // 3) Insere emprestimo_item
      const registros = patrimonios.map((p) => ({
        emprestimoId,
        id_item: p.id_item,
        patrimonio: p.patrimonio,
        id_item_patrimonio: p.id_item_patrimonio,
        status: "pendente",
        pessoaId,
        requisitanteId,
        dataEmprestimo,
      }));
      await trx("emprestimo_item").insert(registros);

      // 4) Marca como emprestado
      await trx("item_patrimonio")
        .whereIn("id", patrimonyIds)
        .update({ emprestado: 1 });

      await trx.commit();

      // 5) Busca dados completos do empréstimo
      const emprestimo = await knex("emprestimo")
        .select(
          "id",
          "dataEmprestimo",
          "dataDevolucao",
          "status",
          "pessoaId",
          "requisitanteId",
          "usuarioDevolucaoId"
        )
        .where({ id: emprestimoId })
        .first();

      // 6) Busca todos os itens do empréstimo
      const allItems = await knex("emprestimo_item")
        .select("id_item_patrimonio")
        .where({ emprestimoId });

      return {
        status: true,
        emprestimo,
        itens: allItems,
      };
    } catch (err) {
      await trx.rollback();
      console.error("Erro ao criar empréstimo:", err);
      return {
        status: false,
        err: "Erro ao criar empréstimo, operação cancelada.",
      };
    }
  }

  async newReturn(
    emprestimoId,
    dataDevolucao,
    usuarioDevolucaoId,
    patrimonyIds
  ) {
    if (!Array.isArray(patrimonyIds) || patrimonyIds.length === 0) {
      return { status: false, err: "Informe a lista de itens para devolução." };
    }

    const trx = await knex.transaction();
    try {
      // 1) Busca empréstimo
      const emprestimo = await trx("emprestimo")
        .select(
          "id",
          "dataEmprestimo",
          "dataDevolucao",
          "status",
          "pessoaId",
          "requisitanteId",
          "usuarioDevolucaoId"
        )
        .where({ id: emprestimoId })
        .first();
      if (!emprestimo) {
        await trx.rollback();
        return { status: false, err: "Empréstimo não encontrado." };
      }

      // 2) Valida data - compara apenas as datas (sem horário)
      const empData = new Date(emprestimo.dataEmprestimo);
      const devData = new Date(dataDevolucao);
      
      // Extrai apenas a data como string YYYY-MM-DD para comparação
      const empDateStr = empData.toISOString().split('T')[0];
      const devDateStr = devData.toISOString().split('T')[0];
      
      console.log("Date comparison:", {
        emprestimo_raw: emprestimo.dataEmprestimo,
        devolucao_raw: dataDevolucao,
        empDateStr,
        devDateStr,
        comparison: devDateStr < empDateStr
      });
      
      if (devDateStr < empDateStr) {
        await trx.rollback();
        return {
          status: false,
          err: "A data de devolução não pode ser anterior à data do empréstimo.",
        };
      }

      // 3) Verifica usuário
      const usuarioExists = await trx("usuario")
        .select("id")
        .where({ id: usuarioDevolucaoId })
        .first();
      if (!usuarioExists) {
        await trx.rollback();
        return {
          status: false,
          err: "Usuário que recebeu devolução não encontrado.",
        };
      }

      // 4) Atualiza cada item e libera patrimônio
      for (const id_item_patrimonio of patrimonyIds) {
        await trx("emprestimo_item")
          .where({ emprestimoId, id_item_patrimonio })
          .update({
            dataDevolucao,
            usuarioDevolucaoId,
            status: "devolvido",
          });
        await trx("item_patrimonio")
          .where({ id: id_item_patrimonio })
          .update({ emprestado: 0 });
      }

      // 5) Se não houver mais pendentes, conclui empréstimo
      const pendente = await trx("emprestimo_item")
        .where({ emprestimoId, status: "pendente" })
        .first();
      if (!pendente) {
        await trx("emprestimo").where({ id: emprestimoId }).update({
          dataDevolucao,
          usuarioDevolucaoId,
          status: "devolvido",
        });
        emprestimo.dataDevolucao = dataDevolucao;
        emprestimo.usuarioDevolucaoId = usuarioDevolucaoId;
        emprestimo.status = "devolvido";
      }

      await trx.commit();

      // 6) Busca todos os itens desse empréstimo, incluindo o campo `emprestado`
      const allItems = await knex("emprestimo_item as ei")
        .join("item_patrimonio as ip", "ei.id_item_patrimonio", "ip.id")
        .select("ei.id_item_patrimonio", "ip.emprestado")
        .where({ "ei.emprestimoId": emprestimoId });

      return {
        status: true,
        emprestimo,
        itens: allItems,
      };
    } catch (err) {
      await trx.rollback();
      console.error("Erro em newReturn:", err);
      return { status: false, err: "Erro ao processar devolução." };
    }
  }

  async findPatrimonio(patrimonio) {
    try {
      var result = await knex
        .select("*")
        .from("item")
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

  async update(id, pessoaId, situacao, novosItens, email, oldPatrimonyIds) {
    // 1) Validações iniciais dos parâmetros
    if (!Array.isArray(oldPatrimonyIds) || oldPatrimonyIds.length === 0) {
      return {
        status: false,
        err: "Nenhum patrimônio antigo informado.",
        statusCode: 400,
      };
    }
    if (!Array.isArray(novosItens) || novosItens.length === 0) {
      return {
        status: false,
        err: "Nenhum item novo fornecido.",
        statusCode: 400,
      };
    }

    // 2) Verifica existência do empréstimo e usuário
    const lending = await this.findById(id, email);
    if (!lending) {
      return {
        status: false,
        err: "Empréstimo não encontrado.",
        statusCode: 404,
      };
    }
    const user = await this.verifyUser(email);
    if (!user) {
      return { status: false, err: "Usuário não autorizado.", statusCode: 403 };
    }

    // 3) Permissões para alterar 'situacao'
    if (!user.admin && situacao !== undefined) {
      return {
        status: false,
        err: "Não pode alterar 'situacao'.",
        statusCode: 403,
      };
    }

    // 4) Se o empréstimo ainda tiver itens pendentes, não permite mudança de situacao
    if (situacao !== undefined) {
      const pendente = await knex("emprestimo_item")
        .where({ emprestimoId: id, status: "pendente" })
        .first();
      if (pendente) {
        return {
          status: false,
          err: "Empréstimo possui itens pendentes.",
          statusCode: 400,
        };
      }
    }

    // 5) Inicia transação para garantir atomicidade
    const trx = await knex.transaction();
    try {
      // 5.1) Verifica que todos oldPatrimonyIds existem nesse empréstimo
      const existing = await trx("emprestimo_item")
        .where({ emprestimoId: id })
        .whereIn("id_item_patrimonio", oldPatrimonyIds)
        .pluck("id_item_patrimonio");
      const missing = oldPatrimonyIds.filter((i) => !existing.includes(i));
      if (missing.length) {
        throw {
          status: 400,
          message: `Patrimônio(s) ${missing.join(
            ", "
          )} não existe(m) no empréstimo.`,
        };
      }

      // 5.2) Libera os antigos itens (marca como não emprestado)
      await trx("item_patrimonio")
        .whereIn("id", oldPatrimonyIds)
        .update({ emprestado: 0 });

      // 5.3) Recalcula totais dos antigos
      await Item.updateItemTotalsByPatrimonyIds(oldPatrimonyIds, trx);

      // 5.4) Atualiza cabeçalho do empréstimo
      if (pessoaId !== undefined) {
        await trx("emprestimo").where({ id }).update({ pessoaId });
      }
      if (situacao !== undefined && user.admin) {
        await trx("emprestimo").where({ id }).update({ situacao });
      }

      // 5.5) Remove registros antigos de emprestimo_item
      await trx("emprestimo_item")
        .where({ emprestimoId: id })
        .whereIn("id_item_patrimonio", oldPatrimonyIds)
        .delete();

      // 5.6) Busca dados dos novos patrimônios
      const newIds = novosItens.map((i) => i.id_item_patrimonio);
      const patrimonios = await trx("item_patrimonio")
        .select("id", "id_item", "patrimonio", "situacao", "emprestado")
        .whereIn("id", newIds);

      if (patrimonios.length !== newIds.length) {
        throw { status: 400, message: "Alguns patrimônios não encontrados." };
      }

      // 5.7) Prepara e insere os novos itens
      const inserts = patrimonios.map((p) => {
        if (p.emprestado === 1) {
          throw { status: 400, message: `Patrimônio ${p.id} já emprestado.` };
        }
        if (p.situacao === 0) {
          throw { status: 400, message: `Patrimônio ${p.id} inativo.` };
        }
        return {
          emprestimoId: id,
          pessoaId: pessoaId ?? lending.pessoaId,
          requisitanteId: lending.requisitanteId,
          dataEmprestimo: lending.dataEmprestimo,
          id_item: p.id_item,
          id_item_patrimonio: p.id,
          patrimonio: p.patrimonio,
          status: "pendente",
        };
      });
      await trx("emprestimo_item").insert(inserts);

      // 5.8) Marca novos itens como emprestados
      await trx("item_patrimonio")
        .whereIn("id", newIds)
        .update({ emprestado: 1 });

      // 5.9) Recalcula totais dos novos itens
      await Item.updateItemTotalsByPatrimonyIds(newIds, trx);

      // 5.10) Commit da transação
      await trx.commit();

      // 6) Após sucesso, retorna o objeto do empréstimo e itens
      const emprestimo = await knex("emprestimo")
        .select(
          "id",
          "dataEmprestimo",
          "dataDevolucao",
          "status",
          "pessoaId",
          "requisitanteId",
          "usuarioDevolucaoId"
        )
        .where({ id })
        .first();

      const itens = await knex("emprestimo_item")
        .select("id_item_patrimonio")
        .where({ emprestimoId: id });

      return { status: true, emprestimo, itens };
    } catch (err) {
      await trx.rollback();
      console.error("Erro ao atualizar empréstimo:", err);
      return {
        status: false,
        err: err.message || "Erro ao atualizar.",
        statusCode: err.status || 500,
      };
    }
  }

  async verifyPessoaSituation(pessoaId) {
    try {
      const pessoa = await knex("pessoa").where({ id: pessoaId }).first();

      if (!pessoa) {
        return { exists: false, situacao: false };
      }

      const isAtiva = pessoa.situacao === 1;

      return { exists: true, situacao: isAtiva };
    } catch (error) {
      console.error("Erro ao verificar situação da pessoa:", error);
      return { exists: false, situacao: false };
    }
  }

  async verifyItensPatrimonySituacao(itens) {
    for (const item of itens) {
      // busca só o campo situacao
      const registro = await knex("item_patrimonio")
        .select("situacao")
        .where("id", item.id_item_patrimonio)
        .first();

      // se não encontrou o patrimônio
      if (!registro) {
        return {
          status: false,
          message: `O patrimônio de ID ${item.id_item_patrimonio} não foi encontrado.`,
        };
      }

      // tratando 1 como ativo e 0 como inativo
      const situacao = registro.situacao;
      if (situacao === 0 || situacao === false) {
        return {
          status: false,
          message: `O patrimônio de ID ${item.id_item_patrimonio} está inativo.`,
        };
      }
    }

    // todos ativos
    return { status: true };
  }

  async verifyItensDisponibilidade(itens) {
    for (let i = 0; i < itens.length; i++) {
      const { id_item_patrimonio } = itens[i];

      // Busca pelo ID do patrimônio
      const item = await knex("item_patrimonio")
        .where({ id: id_item_patrimonio })
        .first();

      if (!item) {
        return {
          valid: false,
          message: `Item patrimônio com ID ${id_item_patrimonio} não foi encontrado.`,
        };
      }

      // Se já estiver emprestado (emprestado = 1), bloqueia
      if (item.emprestado === 1) {
        return {
          valid: false,
          message: `Item patrimônio com ID ${id_item_patrimonio} já está emprestado.`,
        };
      }
    }

    return { valid: true };
  }

  async validateItensPatrimonyExistence(itens) {
    for (const { id_item_patrimonio } of itens) {
      const exists = await knex("item_patrimonio")
        .where({ id: id_item_patrimonio })
        .first();
      if (!exists) {
        return {
          valid: false,
          message: `O item patrimônio com ID ${id_item_patrimonio} não existe no banco de dados.`,
        };
      }
    }
    return { valid: true };
  }

  async verifyUserEdition(email, emprestimoId) {
    // 1) Busca id e admin na tabela usuario
    const usuario = await knex("usuario")
      .select("id", "admin")
      .where({ email })
      .first();

    if (!usuario) {
      const err = new Error("Usuário não encontrado.");
      err.status = 404;
      throw err;
    }

    // 2) Se não for admin, verifica se ele requisitou esse empréstimo
    if (!usuario.admin) {
      const emprestimoItem = await knex("emprestimo_item")
        .where({ emprestimoId, requisitanteId: usuario.id })
        .first();

      if (!emprestimoItem) {
        const err = new Error(
          "Você não tem permissão para editar este empréstimo."
        );
        err.status = 403;
        throw err;
      }
    }

    // Permitido
    return { id: usuario.id, admin: Boolean(usuario.admin) };
  }

  async verificarStatusEmprestimo(emprestimoId) {
    const emprestimo = await knex("emprestimo")
      .select("status")
      .where({ id: emprestimoId })
      .first();
    return emprestimo && emprestimo.status === "pendente";
  }

  async addItem(emprestimoId, patrimonyIds, requisitanteId) {
    const trx = await knex.transaction();
    try {
      // 1) Busca dados do empréstimo
      const emprestimo = await trx("emprestimo")
        .select(
          "id",
          "dataEmprestimo",
          "dataDevolucao",
          "status",
          "pessoaId",
          "requisitanteId",
          "usuarioDevolucaoId"
        )
        .where({ id: emprestimoId })
        .first();
      if (!emprestimo) {
        throw new Error("Empréstimo não encontrado.");
      }

      // 2) Busca patrimonios para inserir
      const patrimonios = await trx("item_patrimonio")
        .select("id as id_item_patrimonio", "id_item", "patrimonio")
        .whereIn("id", patrimonyIds);

      // 3) Prepara e insere registros
      const registros = patrimonios.map((it) => ({
        emprestimoId,
        id_item: it.id_item,
        id_item_patrimonio: it.id_item_patrimonio,
        patrimonio: it.patrimonio,
        dataEmprestimo: emprestimo.dataEmprestimo,
        dataDevolucao: emprestimo.dataDevolucao,
        status: "pendente",
        pessoaId: emprestimo.pessoaId,
        requisitanteId: emprestimo.requisitanteId,
        usuarioDevolucaoId: emprestimo.usuarioDevolucaoId,
      }));
      await trx("emprestimo_item").insert(registros);

      // 4) Marca como emprestado
      await trx("item_patrimonio")
        .whereIn("id", patrimonyIds)
        .update({ emprestado: 1 });

      await trx.commit();

      // 5) Busca todos os itens desse empréstimo, incluindo o campo `emprestado`
      const allItems = await knex("emprestimo_item as ei")
        .join("item_patrimonio as ip", "ei.id_item_patrimonio", "ip.id")
        .select("ei.id_item_patrimonio", "ip.emprestado")
        .where({ "ei.emprestimoId": emprestimoId });

      return {
        status: true,
        emprestimo,
        itens: allItems,
      };
    } catch (err) {
      await trx.rollback();
      console.error("Erro ao adicionar itens ao empréstimo:", err);
      return {
        status: false,
        err: err.message || "Erro ao adicionar item ao empréstimo.",
      };
    }
  }
}

module.exports = new Lending();
