'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import SecurePlayer from '@/components/ui/secure-player';

interface LessonData {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  videoDuration?: number | null;
  isFree: boolean;
  module: { id: string; title: string };
}

interface Props {
  lesson: LessonData;
  courseId: string;
  userName: string;
  locale: string;
}

export default function LessonViewerClient({ lesson, courseId, userName, locale }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center gap-4">
        <Link
          href={`/${locale}/courses/${courseId}`}
          className="rounded-lg border p-2 hover:bg-muted"
          aria-label="Back to course"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">{lesson.module.title}</p>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
        </div>
      </div>

      {lesson.videoUrl && (
        <div className="mb-6 overflow-hidden rounded-xl">
          <SecurePlayer
            videoUrl={lesson.videoUrl}
            userName={userName}
            userIp="0.0.0.0"
          />
        </div>
      )}

      {lesson.description && (
        <p className="mb-4 text-muted-foreground">{lesson.description}</p>
      )}

      {lesson.content && (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}
    </div>
  );
}
