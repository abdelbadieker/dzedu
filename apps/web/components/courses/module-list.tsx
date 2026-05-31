'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, Edit3, Trash2, Video, FileText } from 'lucide-react';
import LessonForm from './lesson-form';

interface Lesson {
  id: string;
  title: string;
  sortOrder: number;
  isPublished: boolean;
  isFree?: boolean;
  videoUrl?: string | null;
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  isPublished: boolean;
  lessons: Lesson[];
}

interface ModuleListProps {
  courseId: string;
  modules: Module[];
}

export default function ModuleList({ courseId, modules }: ModuleListProps) {
  const tc = useTranslations('Common');
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(modules[0]?.id ?? null);
  const [showLessonForm, setShowLessonForm] = useState<{ moduleId: string; lesson?: any } | null>(null);

  const toggleModule = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const addModule = async () => {
    const title = window.prompt('Module title:');
    if (!title?.trim()) return;

    await fetch(`/api/courses/${courseId}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    });

    router.refresh();
  };

  const deleteModule = async (moduleId: string) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;

    await fetch(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' });
    router.refresh();
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!window.confirm('Delete this lesson?')) return;

    await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Modules & Lessons</h2>
        <button
          onClick={addModule}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add Module
        </button>
      </div>

      {modules.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No modules yet. Click &quot;Add Module&quot; to start building.</p>
      )}

      {modules.map((mod) => (
        <div key={mod.id} className="rounded-lg border">
          <button
            onClick={() => toggleModule(mod.id)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              {expanded === mod.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-medium">{mod.title}</span>
              <span className="text-xs text-muted-foreground">({mod.lessons.length} lessons)</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete module"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </button>

          {expanded === mod.id && (
            <div className="border-t px-4 py-2">
              {mod.lessons.length === 0 && (
                <p className="py-3 text-center text-sm text-muted-foreground">No lessons yet.</p>
              )}

              {mod.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {lesson.videoUrl ? (
                      <Video className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{lesson.title}</span>
                    {lesson.isFree && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                        Free
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowLessonForm({ moduleId: mod.id, lesson })}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Edit lesson"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteLesson(mod.id, lesson.id)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Delete lesson"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowLessonForm({ moduleId: mod.id })}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50"
              >
                <Plus className="h-4 w-4" />
                Add Lesson
              </button>
            </div>
          )}
        </div>
      ))}

      {showLessonForm && (
        <LessonForm
          courseId={courseId}
          moduleId={showLessonForm.moduleId}
          lessonId={showLessonForm.lesson?.id}
          initialData={showLessonForm.lesson}
          onClose={() => { setShowLessonForm(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
