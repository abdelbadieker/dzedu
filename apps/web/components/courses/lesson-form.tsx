'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import RichTextEditor from './rich-text-editor';

interface LessonFormProps {
  courseId: string;
  moduleId: string;
  lessonId?: string;
  initialData?: { title?: string; description?: string; content?: string; videoUrl?: string };
  onClose: () => void;
}

export default function LessonForm({ courseId, moduleId, lessonId, initialData, onClose }: LessonFormProps) {
  const tc = useTranslations('Common');
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const baseUrl = `/api/courses/${courseId}/modules/${moduleId}/lessons`;
    const url = lessonId ? `${baseUrl}/${lessonId}` : baseUrl;
    const method = lessonId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, content, videoUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to save lesson');
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10">
      <div className="w-full max-w-3xl rounded-xl border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{lessonId ? tc('edit') : tc('create')} Lesson</h3>
          <button onClick={onClose} aria-label={tc('close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Video URL</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="https://cdn.bunny.net/..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <RichTextEditor content={content} onChange={setContent} placeholder="Write lesson content here..." />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? tc('loading') : tc('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
