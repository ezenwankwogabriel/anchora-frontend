import { z } from "zod";
import type { AssetCategory } from "@/lib/types";

// ── Unified form data shape ────────────────────────────────────────────────
// All categories use the same 5 backend fields. Schema validation and
// per-category labels/options are handled via CATEGORY_CONFIG below.
export interface VaultFormData {
  institutionName: string;
  accountName: string;
  usernameOrEmail: string;
  accountUrl: string;
  notes: string;
}

// ── Per-category Zod schemas ───────────────────────────────────────────────
const req   = (msg = "Required") => z.string().min(1, msg);
const opt   = () => z.string();
const max500 = z.string().max(500, "Max 500 characters");

const enumField = (values: readonly string[], msg: string) =>
  z.string().refine((v) => values.includes(v), msg);

export const categorySchemas = {
  BANK_ACCOUNT: z.object({
    institutionName: req(),
    accountName: enumField(["Savings", "Current", "Domiciliary"], "Select an account type"),
    usernameOrEmail: req("Account number is required"),
    accountUrl: opt(),
    notes: max500,
  }),

  INVESTMENT_PLATFORM: z.object({
    institutionName: req(),
    accountName: enumField(["Stocks", "Savings", "Bonds", "Mixed"], "Select an account type"),
    usernameOrEmail: opt(),
    accountUrl: opt(),
    notes: max500,
  }),

  CRYPTO_WALLET: z.object({
    institutionName: req("Provider name is required"),
    accountName: req("Wallet label is required"),
    usernameOrEmail: enumField(["Hardware wallet", "Software wallet", "Exchange account"], "Select a wallet type"),
    accountUrl: opt(),
    notes: max500,
  }),

  PENSION_PORTAL: z.object({
    institutionName: req("Pension fund administrator is required"),
    accountName: enumField(["CPS (Contributory)", "Legacy", "Other"], "Select an account type"),
    usernameOrEmail: opt(),
    accountUrl: opt(),
    notes: max500,
  }),

  INSURANCE_POLICY: z.object({
    institutionName: req("Provider name is required"),
    accountName: enumField(["Life", "Health", "Auto", "Property", "Other"], "Select a policy type"),
    usernameOrEmail: req("Policy number is required"),
    accountUrl: opt(),
    notes: max500,
  }),

  FOREIGN_ACCOUNT: z.object({
    institutionName: req(),
    accountName: enumField(["Bank account", "Brokerage", "ISA", "Pension", "Other"], "Select an account type"),
    usernameOrEmail: opt(),
    accountUrl: enumField(["United Kingdom", "United States", "Canada", "Other"], "Select a country"),
    notes: max500,
  }),

  OTHER: z.object({
    institutionName: opt(),
    accountName: req("Asset label is required"),
    usernameOrEmail: opt(),
    accountUrl: opt(),
    notes: z.string().min(1, "Description is required").max(500, "Max 500 characters"),
  }),
};

// ── Rendering configuration ────────────────────────────────────────────────
type FieldType = "text" | "select" | "url" | "hidden";

interface FieldConfig {
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: readonly string[];
  required?: boolean;
}

export interface CategoryConfig {
  institutionName: FieldConfig;
  accountName: FieldConfig;
  usernameOrEmail: FieldConfig;
  accountUrl: FieldConfig;
  notesLabel: string;
  notesPlaceholder: string;
  notesRequired?: boolean;
  showCryptoWarning?: boolean;
  defaultValues: VaultFormData;
}

const INSTRUCTIONS_PLACEHOLDER =
  "Add any instructions or context that would help your beneficiary understand or access this account...";

export const CATEGORY_CONFIG: Record<AssetCategory, CategoryConfig> = {
  BANK_ACCOUNT: {
    institutionName: { label: "Institution name", type: "text", placeholder: "e.g. Guaranty Trust Bank", required: true },
    accountName:     { label: "Account type",     type: "select", options: ["Savings", "Current", "Domiciliary"], required: true },
    usernameOrEmail: { label: "Account number",   type: "text",   placeholder: "0123456789", required: true },
    accountUrl:      { label: "",                 type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountName: "Savings", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  INVESTMENT_PLATFORM: {
    institutionName: { label: "Platform name",        type: "text",   placeholder: "e.g. Bamboo, Risevest", required: true },
    accountName:     { label: "Account type",         type: "select", options: ["Stocks", "Savings", "Bonds", "Mixed"], required: true },
    usernameOrEmail: { label: "Account reference",    type: "text",   placeholder: "Reference or account number" },
    accountUrl:      { label: "Platform URL / Online banking link", type: "url", placeholder: "https://..." },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountName: "Stocks", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  CRYPTO_WALLET: {
    institutionName: { label: "Provider name",  type: "text",   placeholder: "e.g. Ledger, MetaMask, Binance", required: true },
    accountName:     { label: "Wallet label",   type: "text",   placeholder: "e.g. My Ledger, Binance Account", required: true },
    usernameOrEmail: { label: "Wallet type",    type: "select", options: ["Hardware wallet", "Software wallet", "Exchange account"], required: true },
    accountUrl:      { label: "",               type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    showCryptoWarning: true,
    defaultValues: { institutionName: "", accountName: "", usernameOrEmail: "Hardware wallet", accountUrl: "", notes: "" },
  },

  PENSION_PORTAL: {
    institutionName: { label: "Pension fund administrator", type: "text",   placeholder: "e.g. ARM Pension, NLPC, Stanbic", required: true },
    accountName:     { label: "Account type",               type: "select", options: ["CPS (Contributory)", "Legacy", "Other"], required: true },
    usernameOrEmail: { label: "RSA PIN",                    type: "text",   placeholder: "Your Retirement Savings Account PIN" },
    accountUrl:      { label: "Portal URL",                 type: "url",    placeholder: "https://..." },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountName: "CPS (Contributory)", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  INSURANCE_POLICY: {
    institutionName: { label: "Provider name",   type: "text",   placeholder: "e.g. AXA Mansard, Leadway Assurance", required: true },
    accountName:     { label: "Policy type",     type: "select", options: ["Life", "Health", "Auto", "Property", "Other"], required: true },
    usernameOrEmail: { label: "Policy number",   type: "text",   placeholder: "Your policy reference number", required: true },
    accountUrl:      { label: "",                type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountName: "Life", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  FOREIGN_ACCOUNT: {
    institutionName: { label: "Institution name", type: "text",   placeholder: "e.g. Barclays, Charles Schwab", required: true },
    accountName:     { label: "Account type",     type: "select", options: ["Bank account", "Brokerage", "ISA", "Pension", "Other"], required: true },
    usernameOrEmail: { label: "Account reference / IBAN", type: "text", placeholder: "Account number or IBAN" },
    accountUrl:      { label: "Country",          type: "select", options: ["United Kingdom", "United States", "Canada", "Other"], required: true },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: "Include currency, account type, or any other details...",
    defaultValues: { institutionName: "", accountName: "Bank account", usernameOrEmail: "", accountUrl: "United Kingdom", notes: "" },
  },

  OTHER: {
    institutionName: { label: "Institution or platform name", type: "text", placeholder: "e.g. Co-operative, ROSCA group" },
    accountName:     { label: "Asset label",                  type: "text", placeholder: "e.g. Co-operative savings, ROSCA", required: true },
    usernameOrEmail: { label: "",                             type: "hidden" },
    accountUrl:      { label: "",                             type: "hidden" },
    notesLabel: "Description",
    notesPlaceholder: "Describe this asset and add any instructions for your beneficiary...",
    notesRequired: true,
    defaultValues: { institutionName: "", accountName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },
};

export function getCategorySchema(category: AssetCategory) {
  return categorySchemas[category];
}
