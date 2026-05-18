import { z } from "zod";
import type { Relationship } from "@/lib/types";

export const RELATIONSHIPS = [
  "SPOUSE", "PARENT", "CHILD", "SIBLING", "FRIEND", "LAWYER", "OTHER",
] as const;

export const beneficiarySchema = z.object({
  name:         z.string().min(1, "Name is required"),
  email:        z.string().min(1, "Email is required").email("Enter a valid email"),
  phone:        z.string().optional(),
  relationship: z.enum(RELATIONSHIPS),
  isDefault:    z.boolean().optional(),
});

export type BeneficiaryFormData = z.infer<typeof beneficiarySchema>;

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  SPOUSE:  "Spouse",
  PARENT:  "Parent",
  CHILD:   "Child",
  SIBLING: "Sibling",
  FRIEND:  "Friend",
  LAWYER:  "Lawyer",
  OTHER:   "Other",
};
