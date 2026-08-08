import { z } from "zod";

function optionalTrimmedString(
  maxLength: number,
  message: string,
) {
  return z
    .string()
    .trim()
    .max(maxLength, message)
    .optional()
    .transform((value) =>
      value ? value : undefined,
    );
}

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Name must be at least 2 characters.",
    )
    .max(
      100,
      "Name must be 100 characters or fewer.",
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(
      150,
      "Email address is too long.",
    )
    .pipe(
      z.email(
        "Please enter a valid email address.",
      ),
    ),

  phone: optionalTrimmedString(
    30,
    "Phone number is too long.",
  ),

  subject: optionalTrimmedString(
    150,
    "Subject must be 150 characters or fewer.",
  ),

  message: z
    .string()
    .trim()
    .min(
      10,
      "Message should be at least 10 characters.",
    )
    .max(
      5000,
      "Message must be 5000 characters or fewer.",
    ),
});

export type ContactInput =
  z.infer<typeof contactSchema>;