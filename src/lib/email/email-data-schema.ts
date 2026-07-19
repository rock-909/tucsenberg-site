import { z } from "zod";

export const productInquiryEmailDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  productName: z.string(),
  requirements: z.string().optional(),
});

export type ProductInquiryEmailData = z.infer<
  typeof productInquiryEmailDataSchema
>;
