import { z } from 'zod';
import { EducationLevel, AccessType } from '@dzedu/shared';

export const createCourseSchema = z.object({
  title: z.string().min(2).max(200),
  shortDescription: z.string().max(300).optional(),
  description: z.string().optional(),
  level: z.nativeEnum(EducationLevel),
  accessType: z.nativeEnum(AccessType),
  price: z.number().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
  promoVideoUrl: z.string().url().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createModuleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  videoDuration: z.number().int().positive().optional(),
  isFree: z.boolean().optional(),
  attachments: z.any().optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), sortOrder: z.number().int().min(0) })),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
