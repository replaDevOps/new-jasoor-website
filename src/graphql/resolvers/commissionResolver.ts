import { dataSource } from '../../datasource';
import CommissionBracket from '../../entity/CommissionBracket';
import { calculateCommission } from '../../services/commissionService';
import { authenticate } from '../../utils/authUtils';

const bracketRepo = dataSource.getRepository(CommissionBracket);

const commissionResolver = {
  Query: {
    /** Admin: all brackets (active + inactive) */
    getCommissionBrackets: async (_: any, __: any, context: any) => {
      await authenticate(context);
      return bracketRepo.find({ order: { fromAmount: 'ASC' } });
    },

    /** Public: only active brackets (used by frontend to show fee table) */
    getActiveCommissionBrackets: async () => {
      return bracketRepo.find({ where: { isActive: true }, order: { fromAmount: 'ASC' } });
    },

    /** Preview what commission a buyer would pay for a given price */
    previewCommission: async (_: any, { price }: { price: number }) => {
      const result = await calculateCommission(price);
      return result.amount;
    },
  },

  Mutation: {
    createCommissionBracket: async (_: any, { input }: any, context: any) => {
      await authenticate(context);
      const bracket = bracketRepo.create({
        ...input,
        percentageValue: input.percentageValue ?? 0,
        fixedValue:      input.fixedValue      ?? 0,
        isActive: true,
        version:  1,
      });
      return bracketRepo.save(bracket);
    },

    updateCommissionBracket: async (_: any, { input }: any, context: any) => {
      await authenticate(context);
      const bracket = await bracketRepo.findOne({ where: { id: input.id } });
      if (!bracket) throw new Error('Commission bracket not found');

      Object.assign(bracket, input);
      // Bump version on any structural change
      if (
        input.fromAmount !== undefined ||
        input.toAmount   !== undefined ||
        input.type       !== undefined ||
        input.percentageValue !== undefined ||
        input.fixedValue !== undefined
      ) {
        bracket.version += 1;
      }
      return bracketRepo.save(bracket);
    },

    deleteCommissionBracket: async (_: any, { id }: { id: string }, context: any) => {
      await authenticate(context);
      const bracket = await bracketRepo.findOne({ where: { id } });
      if (!bracket) throw new Error('Commission bracket not found');
      await bracketRepo.remove(bracket);
      return true;
    },

    toggleCommissionBracket: async (_: any, { id, isActive }: { id: string; isActive: boolean }, context: any) => {
      await authenticate(context);
      const bracket = await bracketRepo.findOne({ where: { id } });
      if (!bracket) throw new Error('Commission bracket not found');
      bracket.isActive = isActive;
      return bracketRepo.save(bracket);
    },
  },
};

export default commissionResolver;
