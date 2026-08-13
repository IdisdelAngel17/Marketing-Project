import { z } from "zod";

export const clientSearchSchema = z.object({
  client: z.string().optional(),
});

export type ClientSearch = z.infer<typeof clientSearchSchema>;
