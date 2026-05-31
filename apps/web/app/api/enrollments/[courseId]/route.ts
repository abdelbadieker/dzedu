import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEnrollmentOrNull } from '@/lib/enrollment/access';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const enrollment = await getEnrollmentOrNull(session.user.id, params.courseId);

    return NextResponse.json({ enrolled: !!enrollment, enrollment });
  } catch (error) {
    console.error('Enrollment check error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
