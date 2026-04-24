import { ProconModel } from "../model/procon.model";
import { Procon } from "../types/procon.types";

export class ProconService {
  private proconModel: ProconModel;

  constructor() {
    this.proconModel = new ProconModel();
  }

  async createProconDev(proconData: Procon) {
    const verifyIfProconExists =
      await this.proconModel.getProconByNomeAndCidade(
        proconData.nome,
        proconData.cidade,
      );

    if (verifyIfProconExists) {
      return {
        sucesso: false,
        erro: `O Procon ${proconData.nome} já existe na cidade ${proconData.cidade}`,
        mensagem: "Erro ao criar Procon",
      };
    }

    try {
      const procon = await this.proconModel.createProconDev(proconData);
      return {
        sucesso: true,
        dados: procon,
        mensagem: "Procon criado com sucesso!",
      };
    } catch (error: any) {
      return {
        sucesso: false,
        erro: error.message,
        mensagem: "Erro ao criar Procon",
      };
    }
  }
}
