import { dataSource } from "../../datasource";
import { Article, FAQ, Terms, User } from "../../entity";
import { authenticate } from "../../utils/authUtils";
import { Brackets, IsNull, Not } from "typeorm";
import { TermsInput, CreateFAQ, CreateArticle } from "../../types";

const articleRepo = dataSource.getRepository(Article);
const FAQRepo = dataSource.getRepository(FAQ);
const termsRepo = dataSource.getRepository(Terms);
const userRepo = dataSource.getRepository(User);

const generalResolver = {
  Query: {
    getArticles: async (
      _: any,
      {
        search,
        isArabic,
        limit,
        offset,
      }: {
        search?: string;
        isArabic?: boolean;
        limit?: number;
        offset?: number;
      }
    ) => {
      const query = articleRepo
        .createQueryBuilder("article")
        .where("article.isDeleted = :isDeleted", { isDeleted: false });

      if (typeof isArabic === "boolean") {
        query.andWhere("article.isArabic = :isArabic", { isArabic });
      }

      if (search) {
        query.andWhere("article.title ILIKE :search", {
          search: `%${search}%`,
        });
      }

      query.orderBy("article.createdAt", "DESC");

      if (limit) {
        query.take(limit);
      }
      if (offset) {
        query.skip(offset);
      }
      const [articles, totalCount] = await query.getManyAndCount();

      return {
        articles,
        totalCount,
      };
    },
    getArticle: async (_: any, { id }: { id: string }) => {
      return await articleRepo.findOne({
        where: { id, isDeleted: false },
      });
    },

    getFAQs: async (
      _: any,
      {
        search,
        isArabic,
        limit,
        offset,
      }: {
        search?: string;
        isArabic?: boolean;
        limit?: number;
        offset?: number;
      }
    ) => {
      const query = FAQRepo.createQueryBuilder("faq").where(
        "faq.isDeleted = :isDeleted",
        { isDeleted: false }
      );

      if (typeof isArabic === "boolean") {
        query.andWhere("faq.isArabic = :isArabic", { isArabic });
      }

      if (search) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where("faq.question ILIKE :search").orWhere(
              "faq.arabicQuestion ILIKE :search"
            );
          }),
          { search: `%${search}%` }
        );
      }

      query.orderBy("faq.createdAt", "DESC");

      if (typeof offset === "number") {
        query.skip(offset);
      }

      if (typeof limit === "number") {
        query.take(limit);
      }

      const [faqs, totalCount] = await query.getManyAndCount();

      return {
        totalCount,
        faqs,
      };
    },
    getFAQ: async (_: any, { id }: { id: string }) => {
      return await FAQRepo.find({
        where: { id, isDeleted: false },
      });
    },

    getTerms: async (_: any, __: any) => {
      return await termsRepo.find({
        where: [
          { term: Not(IsNull()), isDeleted: false },
          { arabicTerm: Not(IsNull()), isDeleted: false },
        ],
      });
    },

    getNDATerms: async (_: any, __: any) => {
      return await termsRepo.find({
        where: [
          { ndaTerm: Not(IsNull()), isDeleted: false },
          { arabicNdaTerm: Not(IsNull()), isDeleted: false },
        ],
      });
    },

    getDSATerms: async (_: any, __: any) => {
      return await termsRepo.find({
        where: [
          { dsaTerms: Not(IsNull()), isDeleted: false },
          { arabicDsaTerms: Not(IsNull()), isDeleted: false },
        ],
      });
    },

    getPrivacyPolicy: async (_: any, __: any) => {
      return await termsRepo.find({
        where: [
          { policy: Not(IsNull()), isDeleted: false },
          { arabicPolicy: Not(IsNull()), isDeleted: false },
        ],
      });
    },
  },
  Mutation: {
    createArticle: async (
      _: any,
      { input }: { input: CreateArticle },
      context: any
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser.userId } });
      if (!user) throw new Error("User Not Found");
      const conditions = [];
      if (input.title) {
        conditions.push({ title: input.title });
      }
      if (input.arabicTitle) {
        conditions.push({ arabicTitle: input.arabicTitle });
      }
      const article = await articleRepo.findOne({ where: conditions });
      if (article) throw new Error("Article with same title uploaded");
      const newArticle = articleRepo.create({
        ...input,
        createdBy: user.id,
        createdAt: new Date(),
      });

      return await articleRepo.save(newArticle);
    },
    updateArticle: async (
      _: any,
      { id, input }: { id: string; input: CreateArticle }
    ) => {
      const article = await articleRepo.findOne({ where: { id } });
      if (!article) throw new Error("Article Not Found");

      if (input.title !== undefined) article.title = input.title;
      if (input.arabicTitle !== undefined)
        article.arabicTitle = input.arabicTitle;
      if (input.image !== undefined) article.image = input.image;
      if (input.body !== undefined) article.body = input.body;
      if (input.arabicBody !== undefined) article.arabicBody = input.arabicBody;
      return await articleRepo.save(article);
    },
    deleteArticle: async (_: any, { id }: { id: string }) => {
      const article = await articleRepo.findOne({ where: { id } });
      if (!article) throw new Error("Article Not Found");
      article.isDeleted = true;
      articleRepo.save(article);
      return true;
    },

    createFAQ: async (
      _: any,
      { input }: { input: CreateFAQ },
      context: any
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser.userId } });
      if (!user) throw new Error("User Not Found");

      const conditions = [];

      if (input.question && input.question.trim() !== "") {
        conditions.push({ question: input.question, isDeleted: false });
      }

      if (input.arabicQuestion && input.arabicQuestion.trim() !== "") {
        conditions.push({
          arabicQuestion: input.arabicQuestion,
          isDeleted: false,
        });
      }
      if (conditions.length > 0) {
        const existingFAQ = await FAQRepo.findOne({ where: conditions });
        if (existingFAQ) throw new Error("Same question uploaded");
      }

      const newFAQ = FAQRepo.create({
        ...input,
        createdBy: user.id,
        createdAt: new Date(),
        isDeleted: false,
      });

      return await FAQRepo.save(newFAQ);
    },
    updateFAQ: async (
      _: any,
      { id, input }: { id: string; input: CreateFAQ }
    ) => {
      const FAQ = await FAQRepo.findOne({ where: { id } });
      if (!FAQ) throw new Error("FAQ Not Found");

      if (input.question !== undefined) FAQ.question = input.question;
      if (input.arabicQuestion !== undefined)
        FAQ.arabicQuestion = input.arabicQuestion;
      if (input.answer !== undefined) FAQ.answer = input.answer;
      if (input.arabicAnswer !== undefined)
        FAQ.arabicAnswer = input.arabicAnswer;
      return await FAQRepo.save(FAQ);
    },
    deleteFAQ: async (_: any, { id }: { id: string }) => {
      const FAQ = await FAQRepo.findOne({ where: { id } });
      if (!FAQ) throw new Error("FAQ Not Found");
      FAQ.isDeleted = true;
      FAQRepo.save(FAQ);
      return FAQ.isDeleted;
    },

    createTerms: async (
      _: any,
      { input }: { input: TermsInput },
      context: any
    ) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser.userId } });
      if (!user) throw new Error("User Not Found");

      let existingTerms;
      let existingArabicTerms;
      let existingNDATerms;
      let existingArabicNDATerms;
      let existingPolicy;
      let existingArabicPolicy;
      let existingDsaTerms;
      let existingArabicDsaTerms;
      if (input.term) {
        existingTerms = await termsRepo.findOne({
          where: { term: Not(IsNull()) },
        });
        if (existingTerms) throw new Error("Terms exist");
      }
      if (input.arabicTerm) {
        existingArabicTerms = await termsRepo.findOne({
          where: { arabicTerm: Not(IsNull()) },
        });
        if (existingArabicTerms) throw new Error("Terms exist");
      }
      if (input.ndaTerm) {
        existingNDATerms = await termsRepo.findOne({
          where: { ndaTerm: Not(IsNull()) },
        });
        if (existingNDATerms) throw new Error("NDA Terms exist");
      }
      if (input.arabicNdaTerm) {
        existingArabicNDATerms = await termsRepo.findOne({
          where: { arabicNdaTerm: Not(IsNull()) },
        });
        if (existingArabicNDATerms) throw new Error("NDA Terms exist");
      }
      if (input.policy) {
        existingPolicy = await termsRepo.findOne({
          where: { policy: Not(IsNull()) },
        });
        if (existingPolicy) throw new Error("Privacy Policy exist");
      }
      if (input.arabicPolicy) {
        existingArabicPolicy = await termsRepo.findOne({
          where: { arabicPolicy: Not(IsNull()) },
        });
        if (existingArabicPolicy) throw new Error("Privacy Policy exist");
      }
      if (input.dsaTerms) {
        existingDsaTerms = await termsRepo.findOne({
          where: { dsaTerms: Not(IsNull()) },
        });
        if (existingDsaTerms) throw new Error("DSA Terms exist");
      }
      if (input.arabicDsaTerms) {
        existingArabicDsaTerms = await termsRepo.findOne({
          where: { arabicDsaTerms: Not(IsNull()) },
        });
        if (existingArabicDsaTerms) throw new Error("DSA Terms exist");
      }
      const newTerms = termsRepo.create({
        ...input,
        createdBy: user.id,
        createdAt: new Date(),
      });

      return await termsRepo.save(newTerms);
    },
    updateTerms: async (
      _: any,
      { id, input }: { id: string; input: TermsInput }
    ) => {
      const existingTerms = await termsRepo.findOne({ where: { id } });
      if (!existingTerms) throw new Error("FAQ Not Found");
      if (input.term !== undefined) existingTerms.term = input.term;
      if (input.arabicTerm !== undefined)
        existingTerms.arabicTerm = input.arabicTerm;
      if (input.ndaTerm !== undefined) existingTerms.ndaTerm = input.ndaTerm;
      if (input.arabicNdaTerm !== undefined)
        existingTerms.arabicNdaTerm = input.arabicNdaTerm;
      if (input.policy !== undefined) existingTerms.policy = input.policy;
      if (input.arabicPolicy !== undefined)
        existingTerms.arabicPolicy = input.arabicPolicy;
      if (input.dsaTerms !== undefined) existingTerms.dsaTerms = input.dsaTerms;
      if (input.arabicDsaTerms !== undefined)
        existingTerms.arabicDsaTerms = input.arabicDsaTerms;
      return await termsRepo.save(existingTerms);
    },
    deleteTerms: async (_: any, { id }: { id: string }) => {
      const existingTerms = await termsRepo.findOne({ where: { id } });
      if (!existingTerms) throw new Error("FAQ Not Found");
      existingTerms.isDeleted = true;
      termsRepo.save(existingTerms);
      return true;
    },
  },
};

export default generalResolver;
