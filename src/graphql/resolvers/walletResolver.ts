import { Bank, DealBank } from "../../entity";
import { dataSource } from "../../datasource";
import { authenticate } from "../../utils/authUtils";
import { BankInput } from "../../types";

const bankRepository = dataSource.getRepository(Bank);
const dealBankRepo = dataSource.getRepository(DealBank);

const walletResolvers = {
  Query: {
    getAdminBanks: async (_: any, __: any, context: any) => {
      const ctxUser = await authenticate(context);
      return await bankRepository.find({
        where: { user: { id: ctxUser?.userId }, isDeleted: false },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
    },
    getActiveAdminBank: async (_: any, __: any) => {
      return await bankRepository.findOne({
        where: { isAdmin: true, isDeleted: false, isActive: true },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
    },

    getUserBanks: async (_: any, { id }: { id: string }, context: any) => {
      const ctxUser = await authenticate(context);
      const bank = await bankRepository.find({
        where: { user: { id: id || ctxUser?.userId }, isDeleted: false },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
      if (!bank) {
        throw new Error("Bank not fount please add bank or active added bank");
      }
      return bank;
    },
    getUserActiveBanks: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      const ctxUser = await authenticate(context);
      const bank = await bankRepository.findOne({
        where: {
          user: { id: id || ctxUser?.userId },
          isDeleted: false,
          isActive: true,
        },
        relations: ["user"],
        order: { createdAt: "DESC" },
      });
      if (!bank) {
        throw new Error("Bank not fount please add bank or active added bank");
      }
      return bank;
    },
  },

  Mutation: {
    addBank: async (_: any, { input }: { input: BankInput }, context: any) => {
      const user = await authenticate(context);
      try {
        const bank = bankRepository.create({
          ...input,
          user: { id: user?.userId },
        });

        const savedBank = await bankRepository.save(bank);
        return savedBank;
      } catch (err) {
        console.error("Failed to add bank:", err);
        throw new Error("Failed to add bank");
      }
    },
    updateBank: async (
      _: any,
      { id, input }: { id: string; input: BankInput },
      context: any
    ) => {
      try {
        const bank = await bankRepository.findOne({ where: { id } });

        if (!bank)
          throw new Error(
            "Bank not found or you are not authorized to update it"
          );

        Object.assign(bank, input);
        const updatedBank = await bankRepository.save(bank);

        return updatedBank;
      } catch (err) {
        throw new Error(`Failed to update bank ${err}`);
      }
    },
    setActiveBank: async (_: any, { id }: { id: string }, context: any) => {
      const user = await authenticate(context);
      const banks = await bankRepository.find({
        where: { user: { id: user?.userId } },
      });
      for (const b of banks) {
        if (b.id === id) {
          b.isActive = true;
        } else {
          b.isActive = false;
        }
        await bankRepository.save(b);
      }
      return true;
    },
    addAdminBank: async (
      _: any,
      { id, input }: { id: string; input: BankInput },
      context: any
    ) => {
      const user = await authenticate(context);
      const existingBank = await bankRepository.findOne({ where: { id } });
      if (existingBank) return existingBank;
      const newBank = bankRepository.create({
        ...input,
        isAdmin: true,
        user: { id: user?.userId },
      });

      return await bankRepository.save(newBank);
    },
    sendBankToBuyer: async (_: any, { id }: { id: string }) => {
      const existingBank = await dealBankRepo.findOne({ where: { id } });
      if (!existingBank) throw new Error("Bank not found");
      existingBank.isSend = true;

      return await bankRepository.save(existingBank);
    },
    deleteBank: async (_: any, { id }: { id: string }) => {
      const bank = await bankRepository.findOne({ where: { id } });
      if (!bank) throw new Error("Bank not found");
      bank.isDeleted = true;
      await bankRepository.save(bank);
      return true;
    },
  },
};

export default walletResolvers;
