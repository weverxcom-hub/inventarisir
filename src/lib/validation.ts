import { z } from "zod";

export const userRoleSchema = z.enum(["Staff", "Approver", "Admin"]);

export const itemConditionSchema = z.enum(["Good", "Repair", "Broken"]);

export const procurementStatusSchema = z.enum([
  "Pending",
  "Approved",
  "Rejected",
  "Completed",
]);

export const inventoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama item wajib diisi").max(200),
  category: z.string().trim().min(1, "Kategori wajib diisi").max(100),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  location: z.string().trim().min(1, "Lokasi wajib diisi").max(200),
  condition: itemConditionSchema.optional().default("Good"),
  photo_url: z.string().url().optional().or(z.literal("")),
  receipt_url: z.string().url().optional().or(z.literal("")),
});

export const inventoryUpdateSchema = inventoryCreateSchema.partial();

export const procurementCreateSchema = z.object({
  item_name: z.string().trim().min(1, "Nama barang wajib diisi").max(200),
  quantity: z.coerce.number().int().min(1).max(1_000_000),
  estimated_price: z.coerce.number().min(0),
  nota_photo_drive_id: z.string().optional().default(""),
});

export const procurementActionSchema = z.object({
  request_id: z.string().min(1),
  status: z.enum(["Approved", "Rejected"]).optional(),
  action: z.enum(["complete"]).optional(),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(200),
  email: z.string().email("Email tidak valid").toLowerCase(),
  password: z.string().min(6, "Password minimal 6 karakter").max(200),
  role: userRoleSchema,
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: userRoleSchema.optional(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(200)
    .optional(),
});

export const bootstrapSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password admin minimal 8 karakter").max(200),
});
