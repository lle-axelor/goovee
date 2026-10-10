import {z} from 'zod';
import {WorkspaceURLSchema} from '@/utils/validators';
import {uploadTokenSchema} from '@/lib/core/upload/validators';

/* `token` redeems a staged upload (company picture pre-uploaded on pick); a
 * null/absent token clears the current picture. */
export const updateCompanyProfileImageSchema = z.object({
  token: uploadTokenSchema.nullish(),
  workspaceURL: WorkspaceURLSchema,
});

export type UpdateCompanyProfileImageValues = z.infer<
  typeof updateCompanyProfileImageSchema
>;

/* MBI: the company website, editable here since registration is the only other
 * place it can be set. A bare domain ("www.example.com") is accepted and gets
 * "https://" on save, so the directory link is never a relative one. */
export function normalizeWebsite(value?: string | null): string | null {
  const website = value?.trim();
  if (!website) return null;
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export function isValidWebsite(value?: string | null): boolean {
  const website = normalizeWebsite(value);
  if (!website) return true;
  try {
    const {hostname} = new URL(website);
    return hostname.includes('.') && !/\s/.test(website);
  } catch {
    return false;
  }
}

export const directorySettingsSchema = z.object({
  companyInDirectory: z.boolean().optional(),
  companyEmail: z.boolean().optional(),
  companyPhone: z.boolean().optional(),
  companyWebsite: z.boolean().optional(),
  companyWebsiteUrl: z
    .string()
    .trim()
    .max(255)
    .refine(isValidWebsite, {message: 'Invalid website address'})
    .optional(),
  companyAddress: z.boolean().optional(),
  companyDescription: z.string().optional(),
  contactInDirectory: z.boolean().optional(),
  contactFunction: z.boolean().optional(),
  contactEmail: z.boolean().optional(),
  contactPhone: z.boolean().optional(),
  contactLinkedin: z.boolean().optional(),
});

export type DirectorySettingsFormValues = z.infer<
  typeof directorySettingsSchema
>;
