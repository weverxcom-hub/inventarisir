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

export const unitCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama unit wajib diisi").max(200),
  code: z.string().trim().max(40).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
});

export const unitUpdateSchema = unitCreateSchema.partial();

export const handoverCreateSchema = z.object({
  handover_date: z.string().trim().min(1, "Tanggal wajib diisi"),
  place: z.string().trim().min(1, "Tempat wajib diisi").max(200),
  giver_name: z.string().trim().min(1, "Nama pemberi wajib diisi").max(200),
  giver_position: z.string().trim().max(200).optional().default(""),
  receiver_name: z
    .string()
    .trim()
    .min(1, "Nama penerima wajib diisi")
    .max(200),
  receiver_position: z.string().trim().max(200).optional().default(""),
  receiver_unit: z
    .string()
    .trim()
    .min(1, "Unit penerima wajib diisi")
    .max(200),
  item_ids: z
    .array(z.string().trim().min(1))
    .min(1, "Minimal satu barang harus dipilih"),
  notes: z.string().trim().max(2000).optional().default(""),
  update_inventory_location: z.boolean().optional().default(true),
});
