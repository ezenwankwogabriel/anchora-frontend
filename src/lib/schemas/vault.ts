import { z } from "zod";
import type { AssetCategory } from "@/lib/types";

// ── Sprint 4 form data shape ───────────────────────────────────────────────
export interface VaultFormData {
  institutionName: string;
  accountName: string;
  referenceId: string;
  credential: string;
  accountUrl: string;
  notes: string;
  executorIntent: "LIQUIDATE" | "TRANSFER" | "HOLD" | "UNSPECIFIED";
  intendedBeneficiary: string;
  isSelfCustodied: boolean;
  accountType: string;
}

// ── Field config (single source of truth for labels/placeholders) ──────────
export type FieldType = "text" | "checkbox" | "textarea" | "select";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  fieldName: keyof VaultFormData;
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  type: FieldType;
  options?: FieldOption[];
}

export const BANK_ACCOUNT_TYPE_OPTIONS: FieldOption[] = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CURRENT", label: "Current" },
  { value: "DOMICILIARY", label: "Domiciliary" },
];

// ── Category groupings (single source of truth) ───────────────────────────
export const DIGITAL_ASSET_CATEGORIES: AssetCategory[] = [
  "BANK_ACCOUNT",
  "INVESTMENT_PLATFORM",
  "CRYPTO_WALLET",
  "PENSION_PORTAL",
  "INSURANCE_POLICY",
  "FOREIGN_ACCOUNT",
];

export const PHYSICAL_ASSET_CATEGORIES: AssetCategory[] = [
  "REAL_ESTATE",
  "VEHICLE",
  "JEWELRY_WATCHES",
  "SHARE_CERTIFICATES",
];

// All selectable categories in the add-asset flow (excludes SUBSCRIPTION, which is legacy).
export const SELECTABLE_CATEGORIES: AssetCategory[] = [
  ...DIGITAL_ASSET_CATEGORIES,
  ...PHYSICAL_ASSET_CATEGORIES,
  "OTHER",
];

// All categories that may appear in vault lists (includes legacy SUBSCRIPTION).
export const ALL_VAULT_CATEGORIES: AssetCategory[] = [
  ...DIGITAL_ASSET_CATEGORIES,
  ...PHYSICAL_ASSET_CATEGORIES,
  "SUBSCRIPTION",
  "OTHER",
];

// ── Physical category helper ───────────────────────────────────────────────
export function isPhysicalCategory(category: AssetCategory): boolean {
  return (
    category === "REAL_ESTATE" ||
    category === "VEHICLE" ||
    category === "JEWELRY_WATCHES" ||
    category === "SHARE_CERTIFICATES" ||
    category === "OTHER"
  );
}

// ── Per-category field configs ─────────────────────────────────────────────
// The "Document location URL" field used to be rendered here as a plain
// text input, as a second, weaker way to point at a document alongside
// direct upload (which stores the file itself, access-controlled by
// Anchora). Upload is now the only path for new documents — see
// vault-document-section.tsx / vault-document-picker.tsx. Any pre-existing
// accountUrl value on an older record is still readable/removable from the
// edit view, just not settable via new UI.
const FIELD_CONFIGS: Record<AssetCategory, FieldConfig[]> = {
  BANK_ACCOUNT: [
    { fieldName: "institutionName", label: "Bank name", placeholder: "e.g. GTB, Zenith, Access Bank", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the account is registered under", type: "text" },
    { fieldName: "referenceId",   label: "Account number", placeholder: "e.g. 0123456789", type: "text" },
    { fieldName: "accountType",     label: "Account type", type: "select", options: BANK_ACCOUNT_TYPE_OPTIONS },
    { fieldName: "notes",           label: "Notes", placeholder: "Account purpose (salary, family house fund, etc.), branch, who should receive this asset, any relevant access context", type: "textarea" },
  ],
  INVESTMENT_PLATFORM: [
    { fieldName: "institutionName", label: "Platform name", placeholder: "e.g. Bamboo, Risevest, PiggyVest", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the account is registered under", type: "text" },
    { fieldName: "credential", label: "Account email", type: "text" },
    { fieldName: "notes",           label: "Notes", placeholder: "e.g. US brokerage account ID: XXXX. NGX (CHN/CSCS no.): XXXX. Broker: XYZ. Who should receive this asset: XYZ.", type: "textarea" },
  ],
  CRYPTO_WALLET: [
    { fieldName: "institutionName", label: "Wallet or exchange name", placeholder: "e.g. Binance, Ledger hardware wallet", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the wallet or exchange account is registered under", type: "text" },
    { fieldName: "credential", label: "Account email / username", type: "text" },
    { fieldName: "isSelfCustodied", label: "I hold my own private keys", type: "checkbox" },
    { fieldName: "notes",           label: "Notes", placeholder: "Seed phrase storage location, hardware wallet location, exchange account details, who should receive this asset", type: "textarea" },
  ],
  PENSION_PORTAL: [
    { fieldName: "institutionName", label: "Pension fund administrator (PFA)", placeholder: "e.g. ARM Pension, Stanbic IBTC", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the RSA is registered under", type: "text" },
    { fieldName: "credential", label: "Account email", type: "text" },
    { fieldName: "notes",           label: "Notes", placeholder: "Portal name, employer name, where login details are stored, who should receive this asset", type: "textarea" },
  ],
  INSURANCE_POLICY: [
    { fieldName: "institutionName", label: "Insurance provider", placeholder: "e.g. AXA Mansard, Leadway Assurance", required: true, type: "text" },
    { fieldName: "accountName",     label: "Policyholder name", helperText: "The legal name the policy is registered under", type: "text" },
    { fieldName: "credential", label: "Account email", type: "text" },
    { fieldName: "notes",           label: "Notes", placeholder: "Policy type (term life, whole life, health), policy number, coverage amount, agent contact, who should receive this asset", type: "textarea" },
  ],
  FOREIGN_ACCOUNT: [
    { fieldName: "institutionName", label: "Institution name", placeholder: "e.g. Barclays UK, Charles Schwab", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the account is registered under", type: "text" },
    { fieldName: "credential", label: "Account email", type: "text" },
    { fieldName: "notes",           label: "Notes", placeholder: "Country, account number, FX or remittance details, who should receive this asset", type: "textarea" },
  ],
  REAL_ESTATE: [
    { fieldName: "institutionName", label: "Property name / description", placeholder: "e.g. Duplex on Admiralty Way, Lekki", required: true, type: "text" },
    { fieldName: "credential", label: "Title number / survey plan ref", type: "text" },
    { fieldName: "notes",           label: "Description & storage notes", placeholder: "Address, where title documents are stored, estimated value, who should receive this asset", type: "textarea" },
  ],
  VEHICLE: [
    { fieldName: "institutionName", label: "Vehicle description", placeholder: "e.g. 2019 Toyota Land Cruiser", required: true, type: "text" },
    { fieldName: "credential", label: "Plate number / chassis number", type: "text" },
    { fieldName: "notes",           label: "Description & storage notes", placeholder: "Colour, where vehicle logbook is stored, who should receive this asset", type: "textarea" },
  ],
  JEWELRY_WATCHES: [
    { fieldName: "institutionName", label: "Item description", placeholder: "e.g. Rolex Datejust, gold wedding band", required: true, type: "text" },
    { fieldName: "credential", label: "Serial number (if known)", type: "text" },
    { fieldName: "notes",           label: "Description & storage notes", placeholder: "Where it is stored, estimated value, who should receive this asset", type: "textarea" },
  ],
  SHARE_CERTIFICATES: [
    { fieldName: "institutionName", label: "Asset description", placeholder: "e.g. Dangote Cement paper cert", required: true, type: "text" },
    { fieldName: "credential", label: "Certificate number", type: "text" },
    { fieldName: "notes",           label: "Description & storage notes", placeholder: "Number of units, where the certificate is physically stored, who should receive this asset", type: "textarea" },
  ],
  SUBSCRIPTION: [
    { fieldName: "institutionName", label: "Service name", placeholder: "e.g. Netflix, Spotify, AWS", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the subscription is registered under", type: "text" },
    { fieldName: "credential", label: "Billing email", type: "text" },
    { fieldName: "notes",           label: "Cancellation instructions", placeholder: "Plan type (family plan, team account), how to cancel: direct link, phone number, or step-by-step instructions, who should receive this asset", type: "textarea" },
  ],
  OTHER: [
    { fieldName: "institutionName", label: "Asset or account name", placeholder: "e.g. PayPal, savings club, industrial generator", required: true, type: "text" },
    { fieldName: "accountName",     label: "Account holder name", helperText: "The legal name the account is registered under", type: "text" },
    { fieldName: "credential", label: "Reference number or account email", type: "text" },
    { fieldName: "notes",           label: "Notes", placeholder: "Description, location, and where any documents are stored, who should receive this asset", type: "textarea" },
  ],
};

export function getFieldConfig(category: AssetCategory): { fields: FieldConfig[] } {
  return { fields: FIELD_CONFIGS[category] };
}

// ── Default form values ────────────────────────────────────────────────────
const BASE_DEFAULTS: VaultFormData = {
  institutionName: "",
  accountName: "",
  referenceId: "",
  credential: "",
  accountUrl: "",
  notes: "",
  executorIntent: "UNSPECIFIED",
  intendedBeneficiary: "",
  isSelfCustodied: false,
  accountType: "",
};

export const CATEGORY_DEFAULTS: Record<AssetCategory, VaultFormData> = {
  BANK_ACCOUNT:        { ...BASE_DEFAULTS },
  INVESTMENT_PLATFORM: { ...BASE_DEFAULTS },
  CRYPTO_WALLET:       { ...BASE_DEFAULTS },
  PENSION_PORTAL:      { ...BASE_DEFAULTS },
  INSURANCE_POLICY:    { ...BASE_DEFAULTS },
  FOREIGN_ACCOUNT:     { ...BASE_DEFAULTS },
  REAL_ESTATE:         { ...BASE_DEFAULTS },
  VEHICLE:             { ...BASE_DEFAULTS },
  JEWELRY_WATCHES:     { ...BASE_DEFAULTS },
  SHARE_CERTIFICATES:  { ...BASE_DEFAULTS },
  SUBSCRIPTION:        { ...BASE_DEFAULTS },
  OTHER:               { ...BASE_DEFAULTS },
};

// ── Per-category Zod schemas ───────────────────────────────────────────────
const req   = (msg = "Required") => z.string().min(1, msg);
const opt   = () => z.string().optional().default("");
const max500 = z.string().max(500, "Max 500 characters").optional().default("");

const intentEnum = z
  .enum(["LIQUIDATE", "TRANSFER", "HOLD", "UNSPECIFIED"])
  .default("UNSPECIFIED");

const sharedFields = {
  referenceId:       opt(),
  accountUrl:          z.string().optional().default(""),
  executorIntent:      intentEnum,
  intendedBeneficiary: opt(),
  isSelfCustodied:     z.boolean().default(false),
  accountType:         opt(),
};

const digitalSchema = (overrides?: object) =>
  z.object({
    institutionName: req(),
    accountName:     opt(),
    credential: opt(),
    notes:           max500,
    ...sharedFields,
    ...overrides,
  });

const physicalSchema = (overrides?: object) =>
  z.object({
    institutionName: req(),
    accountName:     opt(),
    credential: opt(),
    notes:           max500,
    ...sharedFields,
    ...overrides,
  });

export const categorySchemas: Record<AssetCategory, ReturnType<typeof digitalSchema>> = {
  BANK_ACCOUNT:        digitalSchema(),
  INVESTMENT_PLATFORM: digitalSchema(),
  CRYPTO_WALLET:       digitalSchema(),
  PENSION_PORTAL:      digitalSchema(),
  INSURANCE_POLICY:    digitalSchema(),
  FOREIGN_ACCOUNT:     digitalSchema(),
  REAL_ESTATE:         physicalSchema(),
  VEHICLE:             physicalSchema(),
  JEWELRY_WATCHES:     physicalSchema(),
  SHARE_CERTIFICATES:  physicalSchema(),
  SUBSCRIPTION:        digitalSchema(),
  OTHER:               physicalSchema({ institutionName: req("Asset name is required") }),
};

export function getCategorySchema(category: AssetCategory) {
  return categorySchemas[category];
}
