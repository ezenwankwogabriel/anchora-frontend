import { z } from "zod";
import type { AssetCategory } from "@/lib/types";

// ── Unified form data shape ────────────────────────────────────────────────
export interface VaultFormData {
  institutionName: string;  // institution / platform name → backend accountName
  accountType: string;      // type descriptor (select) → backend accountType
  nickname: string;         // user's personal label → backend nickname
  holderName: string;       // name on account/policy → encrypted holderName
  usernameOrEmail: string;  // account number / reference → encrypted usernameOrEmail
  accountUrl: string;       // portal URL or country
  notes: string;            // instructions → encrypted notes
}

// ── Helpers ────────────────────────────────────────────────────────────────
const req   = (msg = "Required") => z.string().min(1, msg);
const opt   = () => z.string();
const max500 = z.string().max(500, "Max 500 characters");

const enumField = (values: readonly string[], msg: string) =>
  z.string().refine((v) => values.includes(v), msg);

// ── Per-category Zod schemas ───────────────────────────────────────────────
export const categorySchemas = {
  BANK_ACCOUNT: z.object({
    institutionName: req(),
    accountType:     enumField(["Savings", "Current", "Domiciliary"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    usernameOrEmail: req("Account number is required"),
    accountUrl:      opt(),
    notes:           max500,
  }),

  INVESTMENT_PLATFORM: z.object({
    institutionName: req(),
    accountType:     enumField(["Stocks", "Savings", "Bonds", "Mixed"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    usernameOrEmail: opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  CRYPTO_WALLET: z.object({
    institutionName: req("Provider name is required"),
    accountType:     enumField(["Hardware wallet", "Software wallet", "Exchange account"], "Select a wallet type"),
    nickname:        req("Wallet label is required"),
    holderName:      opt(),
    usernameOrEmail: opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  PENSION_PORTAL: z.object({
    institutionName: req("Pension fund administrator is required"),
    accountType:     enumField(["CPS (Contributory)", "Legacy", "Other"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    usernameOrEmail: opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  INSURANCE_POLICY: z.object({
    institutionName: req("Provider name is required"),
    accountType:     enumField(["Life", "Health", "Auto", "Property", "Other"], "Select a policy type"),
    nickname:        opt(),
    holderName:      opt(),
    usernameOrEmail: req("Policy number is required"),
    accountUrl:      opt(),
    notes:           max500,
  }),

  FOREIGN_ACCOUNT: z.object({
    institutionName: req(),
    accountType:     enumField(["Bank account", "Brokerage", "ISA", "Pension", "Other"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    usernameOrEmail: opt(),
    accountUrl:      enumField(["United Kingdom", "United States", "Canada", "Other"], "Select a country"),
    notes:           max500,
  }),

  OTHER: z.object({
    institutionName: opt(),
    accountType:     opt(),
    nickname:        req("Asset label is required"),
    holderName:      opt(),
    usernameOrEmail: opt(),
    accountUrl:      opt(),
    notes:           z.string().min(1, "Description is required").max(500, "Max 500 characters"),
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
  accountType: FieldConfig;
  nickname: FieldConfig;
  holderName: FieldConfig;
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
    institutionName: { label: "Institution name",  type: "text",   placeholder: "e.g. Guaranty Trust Bank", required: true },
    accountType:     { label: "Account type",       type: "select", options: ["Savings", "Current", "Domiciliary"], required: true },
    nickname:        { label: "Account label",      type: "text",   placeholder: "e.g. Main savings, Joint account" },
    holderName:      { label: "Account name",       type: "text",   placeholder: "Name registered on the account" },
    usernameOrEmail: { label: "Account number",     type: "text",   placeholder: "0123456789" },
    accountUrl:      { label: "",                   type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Savings", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  INVESTMENT_PLATFORM: {
    institutionName: { label: "Platform name",      type: "text",   placeholder: "e.g. Bamboo, Risevest", required: true },
    accountType:     { label: "Account type",       type: "select", options: ["Stocks", "Savings", "Bonds", "Mixed"], required: true },
    nickname:        { label: "Account label",      type: "text",   placeholder: "e.g. Emergency fund" },
    holderName:      { label: "Account name",       type: "text",   placeholder: "Name registered on the account" },
    usernameOrEmail: { label: "Account reference",  type: "text",   placeholder: "Reference or account number" },
    accountUrl:      { label: "Platform URL",       type: "url",    placeholder: "https://..." },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Stocks", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  CRYPTO_WALLET: {
    institutionName: { label: "Provider name",      type: "text",   placeholder: "e.g. Ledger, MetaMask, Binance", required: true },
    accountType:     { label: "Wallet type",        type: "select", options: ["Hardware wallet", "Software wallet", "Exchange account"], required: true },
    nickname:        { label: "Wallet label",       type: "text",   placeholder: "e.g. My Ledger, Binance Account", required: true },
    holderName:      { label: "",                   type: "hidden" },
    usernameOrEmail: { label: "Username / Email",   type: "text",   placeholder: "Exchange login or reference" },
    accountUrl:      { label: "",                   type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    showCryptoWarning: true,
    defaultValues: { institutionName: "", accountType: "Hardware wallet", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  PENSION_PORTAL: {
    institutionName: { label: "Pension fund administrator", type: "text",   placeholder: "e.g. ARM Pension, NLPC, Stanbic", required: true },
    accountType:     { label: "Account type",               type: "select", options: ["CPS (Contributory)", "Legacy", "Other"], required: true },
    nickname:        { label: "Account label",              type: "text",   placeholder: "e.g. Main pension" },
    holderName:      { label: "Account name",               type: "text",   placeholder: "Name registered on the account" },
    usernameOrEmail: { label: "RSA PIN",                    type: "text",   placeholder: "Your Retirement Savings Account PIN" },
    accountUrl:      { label: "Portal URL",                 type: "url",    placeholder: "https://..." },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "CPS (Contributory)", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  INSURANCE_POLICY: {
    institutionName: { label: "Provider name",       type: "text",   placeholder: "e.g. AXA Mansard, Leadway Assurance", required: true },
    accountType:     { label: "Policy type",         type: "select", options: ["Life", "Health", "Auto", "Property", "Other"], required: true },
    nickname:        { label: "Policy label",        type: "text",   placeholder: "e.g. Family life policy" },
    holderName:      { label: "Policyholder name",   type: "text",   placeholder: "Name on the policy" },
    usernameOrEmail: { label: "Policy number",       type: "text",   placeholder: "Your policy reference number" },
    accountUrl:      { label: "",                    type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Life", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },

  FOREIGN_ACCOUNT: {
    institutionName: { label: "Institution name",         type: "text",   placeholder: "e.g. Barclays, Charles Schwab", required: true },
    accountType:     { label: "Account type",             type: "select", options: ["Bank account", "Brokerage", "ISA", "Pension", "Other"], required: true },
    nickname:        { label: "Account label",            type: "text",   placeholder: "e.g. UK ISA, US brokerage" },
    holderName:      { label: "Account name",             type: "text",   placeholder: "Name on the account" },
    usernameOrEmail: { label: "Account reference / IBAN", type: "text",   placeholder: "Account number or IBAN" },
    accountUrl:      { label: "Country",                  type: "select", options: ["United Kingdom", "United States", "Canada", "Other"], required: true },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: "Include currency, account type, or any other details...",
    defaultValues: { institutionName: "", accountType: "Bank account", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "United Kingdom", notes: "" },
  },

  OTHER: {
    institutionName: { label: "Institution or platform name", type: "text", placeholder: "e.g. Co-operative, ROSCA group" },
    accountType:     { label: "",                             type: "hidden" },
    nickname:        { label: "Asset label",                  type: "text", placeholder: "e.g. Co-operative savings, ROSCA", required: true },
    holderName:      { label: "",                             type: "hidden" },
    usernameOrEmail: { label: "",                             type: "hidden" },
    accountUrl:      { label: "",                             type: "hidden" },
    notesLabel: "Description",
    notesPlaceholder: "Describe this asset and add any instructions for your beneficiary...",
    notesRequired: true,
    defaultValues: { institutionName: "", accountType: "", nickname: "", holderName: "", usernameOrEmail: "", accountUrl: "", notes: "" },
  },
};

export function getCategorySchema(category: AssetCategory) {
  return categorySchemas[category];
}
