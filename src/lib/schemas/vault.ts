import { z } from "zod";
import type { AssetCategory } from "@/lib/types";

// ── Unified form data shape ────────────────────────────────────────────────
export interface VaultFormData {
  institutionName: string;  // institution / platform name → backend accountName
  accountType: string;      // type descriptor (select) → backend accountType
  nickname: string;         // user's personal label → backend nickname
  holderName: string;       // name on account/policy → encrypted holderName
  accountNumber: string;    // bank/foreign account number → encrypted accountNumber
  usernameOrEmail: string;  // online banking login email → encrypted usernameOrEmail
  password: string;         // online banking / portal password → encrypted password
  cardPin: string;          // ATM / card PIN → encrypted cardPin
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
    accountNumber:   req("Account number is required"),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  INVESTMENT_PLATFORM: z.object({
    institutionName: req(),
    accountType:     enumField(["Stocks", "Savings", "Bonds", "Mixed"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  CRYPTO_WALLET: z.object({
    institutionName: req("Provider name is required"),
    accountType:     enumField(["Hardware wallet", "Software wallet", "Exchange account"], "Select a wallet type"),
    nickname:        req("Wallet label is required"),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  PENSION_PORTAL: z.object({
    institutionName: req("Pension fund administrator is required"),
    accountType:     enumField(["CPS (Contributory)", "Legacy", "Other"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  INSURANCE_POLICY: z.object({
    institutionName: req("Provider name is required"),
    accountType:     enumField(["Life", "Health", "Auto", "Property", "Other"], "Select a policy type"),
    nickname:        opt(),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: req("Policy number is required"),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  FOREIGN_ACCOUNT: z.object({
    institutionName: req(),
    accountType:     enumField(["Bank account", "Brokerage", "ISA", "Pension", "Other"], "Select an account type"),
    nickname:        opt(),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      enumField(["United Kingdom", "United States", "Canada", "Other"], "Select a country"),
    notes:           max500,
  }),

  SUBSCRIPTION: z.object({
    institutionName: req("Service name is required"),
    accountType:     enumField(["Monthly", "Annual", "Weekly"], "Select a billing cycle"),
    nickname:        opt(),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           max500,
  }),

  OTHER: z.object({
    institutionName: opt(),
    accountType:     opt(),
    nickname:        req("Asset label is required"),
    holderName:      opt(),
    accountNumber:   opt(),
    usernameOrEmail: opt(),
    password:        opt(),
    cardPin:         opt(),
    accountUrl:      opt(),
    notes:           z.string().min(1, "Description is required").max(500, "Max 500 characters"),
  }),
};

// ── Rendering configuration ────────────────────────────────────────────────
type FieldType = "text" | "select" | "url" | "hidden" | "password";

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
  accountNumber: FieldConfig;
  usernameOrEmail: FieldConfig;
  password: FieldConfig;
  cardPin: FieldConfig;
  accountUrl: FieldConfig;
  notesLabel: string;
  notesPlaceholder: string;
  notesRequired?: boolean;
  defaultValues: VaultFormData;
}

const INSTRUCTIONS_PLACEHOLDER =
  "Add any instructions or context that would help your beneficiary understand or access this account...";

export const CATEGORY_CONFIG: Record<AssetCategory, CategoryConfig> = {
  BANK_ACCOUNT: {
    institutionName: { label: "Institution name",       type: "text",     placeholder: "e.g. Guaranty Trust Bank", required: true },
    accountType:     { label: "Account type",            type: "select",   options: ["Savings", "Current", "Domiciliary"], required: true },
    nickname:        { label: "Account label",           type: "text",     placeholder: "e.g. Main savings, Joint account" },
    holderName:      { label: "Account name",            type: "text",     placeholder: "Name registered on the account" },
    accountNumber:   { label: "Account number",          type: "text",     placeholder: "0123456789", required: true },
    usernameOrEmail: { label: "Online banking email",    type: "text",     placeholder: "Your internet banking login email" },
    password:        { label: "Online banking password", type: "password", placeholder: "Your internet banking password" },
    cardPin:         { label: "Card PIN",                type: "password", placeholder: "4-digit ATM PIN" },
    accountUrl:      { label: "",                        type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Savings", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },

  INVESTMENT_PLATFORM: {
    institutionName: { label: "Platform name",      type: "text",     placeholder: "e.g. Bamboo, Risevest", required: true },
    accountType:     { label: "Account type",       type: "select",   options: ["Stocks", "Savings", "Bonds", "Mixed"], required: true },
    nickname:        { label: "Account label",      type: "text",     placeholder: "e.g. Emergency fund" },
    holderName:      { label: "Account name",       type: "text",     placeholder: "Name registered on the account" },
    accountNumber:   { label: "",                   type: "hidden" },
    usernameOrEmail: { label: "Account reference",  type: "text",     placeholder: "Reference or account number" },
    password:        { label: "Portal password",    type: "password", placeholder: "Your login password" },
    cardPin:         { label: "",                   type: "hidden" },
    accountUrl:      { label: "Platform URL",       type: "url",      placeholder: "https://..." },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Stocks", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },

  CRYPTO_WALLET: {
    institutionName: { label: "Provider name",      type: "text",     placeholder: "e.g. Ledger, MetaMask, Binance", required: true },
    accountType:     { label: "Wallet type",        type: "select",   options: ["Hardware wallet", "Software wallet", "Exchange account"], required: true },
    nickname:        { label: "Wallet label",       type: "text",     placeholder: "e.g. My Ledger, Binance Account", required: true },
    holderName:      { label: "",                   type: "hidden" },
    accountNumber:   { label: "",                   type: "hidden" },
    usernameOrEmail: { label: "Username / Email",   type: "text",     placeholder: "Exchange login or reference" },
    password:        { label: "",                   type: "hidden" },
    cardPin:         { label: "",                   type: "hidden" },
    accountUrl:      { label: "",                   type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Hardware wallet", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },

  PENSION_PORTAL: {
    institutionName: { label: "Pension fund administrator", type: "text",     placeholder: "e.g. ARM Pension, NLPC, Stanbic", required: true },
    accountType:     { label: "Account type",               type: "select",   options: ["CPS (Contributory)", "Legacy", "Other"], required: true },
    nickname:        { label: "Account label",              type: "text",     placeholder: "e.g. Main pension" },
    holderName:      { label: "Account name",               type: "text",     placeholder: "Name registered on the account" },
    accountNumber:   { label: "",                           type: "hidden" },
    usernameOrEmail: { label: "RSA PIN",                    type: "text",     placeholder: "Your Retirement Savings Account PIN" },
    password:        { label: "Portal password",            type: "password", placeholder: "Your portal login password" },
    cardPin:         { label: "",                           type: "hidden" },
    accountUrl:      { label: "Portal URL",                 type: "url",      placeholder: "https://..." },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "CPS (Contributory)", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },

  INSURANCE_POLICY: {
    institutionName: { label: "Provider name",       type: "text",     placeholder: "e.g. AXA Mansard, Leadway Assurance", required: true },
    accountType:     { label: "Policy type",         type: "select",   options: ["Life", "Health", "Auto", "Property", "Other"], required: true },
    nickname:        { label: "Policy label",        type: "text",     placeholder: "e.g. Family life policy" },
    holderName:      { label: "Policyholder name",   type: "text",     placeholder: "Name on the policy" },
    accountNumber:   { label: "",                    type: "hidden" },
    usernameOrEmail: { label: "Policy number",       type: "text",     placeholder: "Your policy reference number" },
    password:        { label: "Portal password",     type: "password", placeholder: "Your portal login password" },
    cardPin:         { label: "",                    type: "hidden" },
    accountUrl:      { label: "",                    type: "hidden" },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: INSTRUCTIONS_PLACEHOLDER,
    defaultValues: { institutionName: "", accountType: "Life", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },

  FOREIGN_ACCOUNT: {
    institutionName: { label: "Institution name",        type: "text",     placeholder: "e.g. Barclays, Charles Schwab", required: true },
    accountType:     { label: "Account type",            type: "select",   options: ["Bank account", "Brokerage", "ISA", "Pension", "Other"], required: true },
    nickname:        { label: "Account label",           type: "text",     placeholder: "e.g. UK ISA, US brokerage" },
    holderName:      { label: "Account name",            type: "text",     placeholder: "Name on the account" },
    accountNumber:   { label: "Account number / IBAN",   type: "text",     placeholder: "Account number or IBAN" },
    usernameOrEmail: { label: "Online banking email",    type: "text",     placeholder: "Your internet banking login email" },
    password:        { label: "Online banking password", type: "password", placeholder: "Your internet banking password" },
    cardPin:         { label: "Card PIN",                type: "password", placeholder: "4-digit card PIN" },
    accountUrl:      { label: "Country",                 type: "select",   options: ["United Kingdom", "United States", "Canada", "Other"], required: true },
    notesLabel: "Instructions for your beneficiary",
    notesPlaceholder: "Include currency, account type, or any other details...",
    defaultValues: { institutionName: "", accountType: "Bank account", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "United Kingdom", notes: "" },
  },

  SUBSCRIPTION: {
    institutionName: { label: "Service name",        type: "text",     placeholder: "e.g. Netflix, Spotify, AWS", required: true },
    accountType:     { label: "Billing cycle",        type: "select",   options: ["Monthly", "Annual", "Weekly"], required: true },
    nickname:        { label: "Subscription label",   type: "text",     placeholder: "e.g. Family plan, Team account" },
    holderName:      { label: "",                     type: "hidden" },
    accountNumber:   { label: "",                     type: "hidden" },
    usernameOrEmail: { label: "Billing email",        type: "text",     placeholder: "Email used for billing or login" },
    password:        { label: "Account password",     type: "password", placeholder: "Your login password" },
    cardPin:         { label: "",                     type: "hidden" },
    accountUrl:      { label: "Cancellation URL",     type: "url",      placeholder: "https://..." },
    notesLabel: "Cancellation instructions",
    notesPlaceholder: "How to cancel — direct link, phone number, or step-by-step instructions...",
    defaultValues: { institutionName: "", accountType: "Monthly", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },

  OTHER: {
    institutionName: { label: "Institution or platform name", type: "text",   placeholder: "e.g. Co-operative, ROSCA group" },
    accountType:     { label: "",                             type: "hidden" },
    nickname:        { label: "Asset label",                  type: "text",   placeholder: "e.g. Co-operative savings, ROSCA", required: true },
    holderName:      { label: "",                             type: "hidden" },
    accountNumber:   { label: "",                             type: "hidden" },
    usernameOrEmail: { label: "",                             type: "hidden" },
    password:        { label: "",                             type: "hidden" },
    cardPin:         { label: "",                             type: "hidden" },
    accountUrl:      { label: "",                             type: "hidden" },
    notesLabel: "Description",
    notesPlaceholder: "Describe this asset and add any instructions for your beneficiary...",
    notesRequired: true,
    defaultValues: { institutionName: "", accountType: "", nickname: "", holderName: "", accountNumber: "", usernameOrEmail: "", password: "", cardPin: "", accountUrl: "", notes: "" },
  },
};

export function getCategorySchema(category: AssetCategory) {
  return categorySchemas[category];
}
