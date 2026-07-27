import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.email("Please enter a valid email address."),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message should be at least 10 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;