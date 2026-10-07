import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LanguageProvider } from '../src/app/providers/LanguageProvider';
import { ThemeProvider } from '../src/app/providers/ThemeProvider';
import ErrorScreen from '../src/app/shell/ErrorScreen';
import ExamCountdownWidget from '../src/features/planning/components/ExamCountdownWidget';
import AttendanceMeter from '../src/features/timetable/components/AttendanceMeter';
import type { TimetableItem } from '../src/shared/types/usas';

function renderWithProviders(node: ReactNode): string {
  return renderToStaticMarkup(
    createElement(LanguageProvider, null,
      createElement(ThemeProvider, null, node),
    ),
  );
}

describe('shared timetable UI', () => {
  it('shows the empty, warning, caution, and healthy attendance states', () => {
    const empty = renderWithProviders(createElement(AttendanceMeter));
    const warning = renderWithProviders(createElement(AttendanceMeter, { percentStr: '79%' }));
    const caution = renderWithProviders(createElement(AttendanceMeter, { percentStr: '82%' }));
    const healthy = renderWithProviders(createElement(AttendanceMeter, { percentStr: '105%' }));

    expect(empty).toContain('No Records Yet');
    expect(warning).toContain('Below 80%');
    expect(caution).toContain('Warning');
    expect(healthy).toContain('105%');
    expect(healthy).toContain('width:100%');
  });

  it('uses status defaults and caller copy in the error screen', () => {
    const notFound = renderWithProviders(createElement(ErrorScreen, { status: 404 }));
    const offline = renderWithProviders(createElement(ErrorScreen, {
      status: 503,
      title: 'No network',
      offline: true,
    }));

    expect(notFound).toContain('Page not found');
    expect(notFound).toContain('Go home');
    expect(offline).toContain('No network');
    expect(offline).toContain('Retry');
    expect(offline).toContain('bg-sky-500/10');
  });

  it('shows the nearest exam and falls back to stable course identifiers', () => {
    const examDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const courses: (TimetableItem & { exam_date: string })[] = [{
      id: 'course-fallback',
      day: 'ISNIN',
      exam_date: examDate,
    }];

    const markup = renderWithProviders(createElement(ExamCountdownWidget, {
      courses,
      onOpenExam: () => undefined,
    }));
    const outsideWindowCourses: (TimetableItem & { exam_date: string })[] = [{
        id: 'course-later',
        day: 'ISNIN',
        exam_date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      }];
    const outsideWindow = renderWithProviders(createElement(ExamCountdownWidget, {
      courses: outsideWindowCourses,
      onOpenExam: () => undefined,
    }));

    expect(markup).toContain('course-fallback');
    expect(markup).toContain('3 Days Left');
    expect(outsideWindow).toBe('');
  });

  it('hides past exams and labels demo countdowns', () => {
    const pastCourses: (TimetableItem & { exam_date: string })[] = [{
      id: 'past-course',
      day: 'ISNIN',
      exam_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }];
    const courseWithoutExam: TimetableItem[] = [{ id: 'demo-course', day: 'ISNIN' }];

    const past = renderWithProviders(createElement(ExamCountdownWidget, {
      courses: pastCourses,
      onOpenExam: () => undefined,
    }));
    const demo = renderWithProviders(createElement(ExamCountdownWidget, {
      courses: courseWithoutExam,
      isDemo: true,
      onOpenExam: () => undefined,
    }));

    expect(past).toBe('');
    expect(demo).toContain('demo-course [Demo]');
    expect(demo).toContain('14 Days Left');
  });
});
