'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { EducationLevel, AccessType } from '@dzedu/shared';
import { createCourseSchema, type CreateCourseInput } from '@/lib/course/types';

interface CourseFormProps {
  initialData?: Partial<CreateCourseInput>;
  courseId?: string;
  onSuccess?: () => void;
}

export default function CourseForm({ initialData, courseId, onSuccess }: CourseFormProps) {
  const t = useTranslations('Courses');
  const tc = useTranslations('Common');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      shortDescription: initialData?.shortDescription ?? '',
      description: initialData?.description ?? '',
      level: initialData?.level ?? EducationLevel.MIDDLE,
      accessType: initialData?.accessType ?? AccessType.FREE,
      tags: initialData?.tags ?? [],
    },
  });

  const onSubmit = async (data: CreateCourseInput) => {
    const url = courseId ? `/api/courses/${courseId}` : '/api/courses';
    const method = courseId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Failed to save course');
    }

    router.refresh();
    router.push('/dashboard/courses');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">{t('form.title') ?? 'Title'}</label>
        <input
          {...register('title')}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder={tc('create')}
        />
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t('form.shortDescription') ?? 'Short Description'}</label>
        <textarea
          {...register('shortDescription')}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('form.level') ?? 'Level'}</label>
          <select {...register('level')} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            {Object.values(EducationLevel).map((l) => (
              <option key={l} value={l}>{t(`levels.${l}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t('form.accessType') ?? 'Access Type'}</label>
          <select {...register('accessType')} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
            {Object.values(AccessType).map((a) => (
              <option key={a} value={a}>{t(`access.${a}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? tc('loading') : (courseId ? tc('save') : tc('create'))}
      </button>
    </form>
  );
}
