var knex = require("../database/connection");

class HomeController {
  async index(req, res) {
    try {
      // Obtém o email do usuário do token via middleware
      const email = req.user?.email;

      if (!email) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Busca informações do usuário
      const user = await knex("usuario")
        .select("id", "nome", "email", "telefone", "admin", "situacao")
        .where({ email })
        .first();

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      return res.status(200).json({
        status: true,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          admin: user.admin === 1,
          situacao: user.situacao === 1,
        },
      });
    } catch (error) {
      console.error("Erro em HomeController.index:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}

module.exports = new HomeController();