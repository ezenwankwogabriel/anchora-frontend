import { z } from "zod";

export const executorSchema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters"),
  email:        z.string().email("Enter a valid email address"),
  phone:        z.string().optional(),
  relationship: z.string().optional(),
});

export type ExecutorFormData = z.infer<typeof executorSchema>;
