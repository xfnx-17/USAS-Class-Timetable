import type { ReactNode, Ref } from 'react';
import type { TimetableItem, TimeFormat } from '@/shared/types/usas';
import { extractDayName, formatDayDisplay } from '@/shared/lib/dayFormat';
import { formatDurationRange, type ExportTheme } from '../lib/wallpaperExportHelpers';

type FormalA4PreviewProps = {
  previewShellRef: Ref<HTMLDivElement>;
  pdfRef: Ref<HTMLDivElement>;
  previewHeight: number;
  finalScale: number;
  renderFloatingZoomWidget: (isLight: boolean) => ReactNode;
  isLight: boolean;
  exportTheme: ExportTheme;
  semesterStr: string;
  studentName: string;
  matricNo: string;
  programName: string;
  lang: string;
  pdfCourses: TimetableItem[];
  normalizeGroup: (group?: string) => string;
  t: (key: string) => string;
  timeFormat: TimeFormat;
};

export default function FormalA4Preview({
  previewShellRef, pdfRef, previewHeight, finalScale, renderFloatingZoomWidget, isLight,
  exportTheme, semesterStr, studentName, matricNo, programName, lang, pdfCourses,
  normalizeGroup, t, timeFormat,
}: FormalA4PreviewProps) {
  return (
<div
              ref={previewShellRef}
              data-lenis-prevent
              className={`border rounded-xl p-2 sm:p-3 bg-white overflow-x-auto overflow-y-hidden relative ${isLight ? 'border-slate-200 shadow-sm' : 'border-white/10 shadow-inner'}`}
              style={{
                height: previewHeight ? `${Math.ceil(previewHeight * finalScale) + 48}px` : 'auto',
                maxHeight: 'none'
              }}
            >
              <div className="absolute inset-0 pointer-events-none z-30">
                {renderFloatingZoomWidget(true)}
              </div>
              <div
                style={{
                  width: `${840 * finalScale}px`,
                  height: `${previewHeight * finalScale}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                <div
                  ref={pdfRef}
                  data-export-root="formal-a4-export-root"
                  className="bg-white text-slate-950 p-6 rounded-lg text-xs shadow-inner border border-slate-300 w-[840px] max-w-none absolute top-0 left-0"
                  style={{
                    transform: `scale(${finalScale})`,
                    transformOrigin: 'top left',
                    fontFamily: 'Inter, Arial, sans-serif'
                  }}
                >
                  {/* Official Branding Header */}
                  <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <img src={exportTheme === 'light' ? '/usas-logo-light.png' : '/usas-logo-dark.png'} alt="USAS Crest" className="w-10 h-10 object-contain" />
                      <div>
                        <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase leading-tight whitespace-nowrap">
                          UNIVERSITI SULTAN AZLAN SHAH (USAS)
                        </h1>
                        <h2 className="text-[10px] font-bold text-amber-800 uppercase mt-1 leading-tight whitespace-nowrap">
                          JADUAL WAKTU KULIAH PELAJAR
                        </h2>
                        <p className="text-[9px] text-slate-500 font-semibold mt-1 leading-tight whitespace-nowrap">
                          {semesterStr || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[9px] text-slate-500 font-semibold leading-tight">
                      <div>Format: A4 LANDSCAPE</div>
                      <div className="text-amber-800 font-bold">RAHMATAN LIL 'ALAMIN</div>
                    </div>
                  </div>

                  {/* Student Identity Block */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[9.5px]">
                    <div>
                      <span className="font-bold text-slate-600">NAMA PELAJAR:</span> <span className="font-extrabold text-slate-900">{studentName || '—'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600">NO. MATRIK:</span> <span className="font-extrabold text-slate-900">{matricNo || '—'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600">PROGRAM:</span> <span className="font-extrabold text-slate-900">{programName || '—'}</span>
                    </div>
                  </div>

                  <table className="w-full table-fixed border-separate border-spacing-0 border-l border-t border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold" style={{ height: '32px' }}>
                        <th className="border-r border-b border-slate-400 px-2 py-1.5 text-center align-middle w-20">
                          <span>{lang === 'en' ? 'DAY' : 'HARI'}</span>
                        </th>
                        <th className="border-r border-b border-slate-400 px-2 py-1.5 text-center align-middle w-28">
                          <span>{lang === 'en' ? 'TIME' : 'WAKTU'}</span>
                        </th>
                        <th className="border-r border-b border-slate-400 px-2.5 py-1.5 text-left align-middle w-24">
                          <span>{lang === 'en' ? 'CODE' : 'KOD'}</span>
                        </th>
                        <th className="border-r border-b border-slate-400 px-2.5 py-1.5 text-left align-middle">
                          <span>{lang === 'en' ? 'COURSE NAME' : 'NAMA KURSUS'}</span>
                        </th>
                        <th className="border-r border-b border-slate-400 px-2.5 py-1.5 text-center align-middle w-16">
                          <span>{lang === 'en' ? 'GROUP' : 'GROUP'}</span>
                        </th>
                        <th className="border-r border-b border-slate-400 px-2.5 py-1.5 text-left align-middle w-36">
                          <span>{lang === 'en' ? 'LOCATION' : 'LOKASI'}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdfCourses.map((c, i) => {
                        const dayName = extractDayName(c.day);
                        const prevName = i > 0 ? extractDayName(pdfCourses[i - 1].day) : '';
                        const isFirstOfDay = dayName !== prevName;
                        let span = 1;
                        if (isFirstOfDay) {
                          for (let j = i + 1; j < pdfCourses.length && extractDayName(pdfCourses.at(j)?.day) === dayName; j += 1) {
                            span += 1;
                          }
                        }
                        return (
                          <tr key={i} style={{ height: '30px' }}>
                            {isFirstOfDay && (
                              <td data-export-formal-day-cell rowSpan={span} className="border-r border-b border-slate-300 bg-white px-2 py-1 text-center align-middle font-bold text-amber-800">
                                <span>{formatDayDisplay(c.day, t)}</span>
                              </td>
                            )}
                            <td className={`border-r border-b border-slate-300 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} px-2 py-1 text-center align-middle font-medium`}>
                              <span>{formatDurationRange(c.start_time || c.jadual, c.end_time, timeFormat)}</span>
                            </td>
                            <td className={`border-r border-b border-slate-300 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} px-2.5 py-1 text-left align-middle font-bold text-blue-900`}>
                              <span>{c.course_id || c.kod_kursus}</span>
                            </td>
                            <td className={`border-r border-b border-slate-300 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} px-2.5 py-1 text-left align-middle font-semibold text-slate-900`}>
                              <span>{c.course_name || c.kursus}</span>
                            </td>
                            <td className={`border-r border-b border-slate-300 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} px-2.5 py-1 text-center align-middle font-bold`}>
                              <span>{normalizeGroup(c.group || c.kumpulan) || '—'}</span>
                            </td>
                            <td className={`border-r border-b border-slate-300 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} px-2.5 py-1 text-left align-middle text-slate-800`}>
                              <span>{c.location || ''}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Relocated Date & Time Footer */}
                  <div className="mt-3 pt-1.5 border-t border-slate-200 text-[8px] text-slate-500 flex flex-wrap justify-between items-center font-medium gap-x-3 gap-y-1">
                    <span>{lang === 'en' ? 'Generated by STEM USAS.' : 'Dijana oleh STEM USAS.'}</span>
                    <span>{lang === 'en' ? 'Printed Date' : 'Tarikh Cetakan'}: {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ms-MY')} {new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'ms-MY', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
  );
}
