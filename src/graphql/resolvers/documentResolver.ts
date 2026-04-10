import { UpdateDocumentInput } from '../../types';
import { dataSource } from '../../datasource';
import { Business, Document, User, Notification } from '../../entity';
import { authenticate } from '../../utils/authUtils';
import { UserStatus } from '../../enum';

const documentRepo = dataSource.getRepository(Document);
const userRepo = dataSource.getRepository(User);
const businessRepo = dataSource.getRepository(Business);
const notificationRepo = dataSource.getRepository(Notification);

const documentResolver = {
  Query: {
    getDocuments: async (_: any, { limit, offset }: { limit: number; offset: number }) => {
      return await documentRepo.find({
        take: limit,
        skip: offset,
        order: { createdAt: 'DESC' },
        relations: ['uploadedBy'],
      });
    },
    getDocument: async (_: any, { id }: { id: string }) => {
      const documentRepo = dataSource.getRepository(Document);
      return await documentRepo.findOne({
        where: { id },
        relations: ['uploadedBy'],
      });
    },
  },
  Mutation: {
    createDocument: async (_: any, { input }: { input: any }) => {

      const uploader = await userRepo.findOne({ where: { id: input.uploadedById } });
      if (!uploader) throw new Error('Uploader not found');

      const newDoc = documentRepo.create({
        ...input,
        uploadedBy: uploader,
        uploadedAt: new Date(),
      });

      return await documentRepo.save(newDoc);
    },
    updateDocument: async (_: any, { input }: { input: any }) => {
      const doc = await documentRepo.findOne({ where: { id: input.id } });
      if (!doc) throw new Error('Document not found');

      Object.assign(doc, input);
      return await documentRepo.save(doc);
    },
    uploadDocument: async (_: any, { input }: { input: UpdateDocumentInput }) => {
      const business = await businessRepo.findOne({ where: { id: input.businessId } });
      if (!business) throw new Error('Business not found');

      const newDoc = documentRepo.create({  ...input, business: business });
      return await documentRepo.save(newDoc);
    },
    deleteDocument: async (_: any, { id }: { id: string }) => {
      const result = await documentRepo.delete(id);
      return result.affected === 1;
    },

    uploadIdentityDocument: async (_: any, { input }: { input: any }, context: any) => {
      const ctxUser = await authenticate(context);
      const user = await userRepo.findOne({ where: { id: ctxUser.userId } });
      if (!user) throw new Error('User not found');

      // Save document linked to this user
      const doc = documentRepo.create({
        title: input.title,
        fileName: input.fileName,
        fileType: input.fileType,
        filePath: input.filePath,
        description: input.description ?? 'identity',
        user,
        userId: user.id,
      });
      const savedDoc = await documentRepo.save(doc);

      // Set user status to under_review
      user.status = UserStatus.under_review;
      await userRepo.save(user);

      // Notify the user that their document is under review
      const notification = notificationRepo.create({
        name: 'طلب التحقق من الهوية',
        message: 'تم استلام وثيقة هويتك بنجاح. سيتم مراجعتها من قِبل فريقنا قريباً.',
        isRead: false,
        isAdmin: false,
        user,
      });
      await notificationRepo.save(notification);

      return savedDoc;
    },
  },
};

export default documentResolver;
