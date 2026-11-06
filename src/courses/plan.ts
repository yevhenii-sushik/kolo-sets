import type { Collection, Course } from "../types";
import { courseCodeFromLanguage, defaultVoice, getCourseLanguage } from "./languages";

// Чистая функция без записи в базу: по профилю и наборам решает, какие курсы должны быть,
// к какому курсу относится каждый набор и папка, и какой курс активный.
// Используется и для первой миграции, и для «самолечения» наборов, созданных старой версией
// приложения без courseId. Повторный запуск на тех же данных ничего не меняет.

export const COURSES_VERSION = 1;

// Плану от папки нужны только id и курс — остальные поля переносятся как есть
export interface FolderLike {
  id: string;
  courseId?: string;
}

export interface CoursesInput<F extends FolderLike> {
  courses?: Course[];
  activeCourseId?: string | null;
  folders?: F[];
  coursesVersion?: number;
}

export interface CoursesPlan<F extends FolderLike> {
  courses: Course[];
  activeCourseId: string | null;
  folders: F[];
  // courseId — курс набора; clearFolder — набор ссылается на папку другого курса или на удалённую папку
  collectionUpdates: { id: string; courseId: string; clearFolder: boolean }[];
  profileChanged: boolean; // нужно записать courses / folders / activeCourseId / coursesVersion
}

// Голос для нового курса из языка набора: 'en-US' сохраняем, если это известный вариант
function voiceFor(code: string, language: string | undefined): string {
  const variants = getCourseLanguage(code)?.variants ?? [];
  const match = variants.find((x) => x.voice.toLowerCase() === language?.toLowerCase());
  return match?.voice ?? defaultVoice(code);
}

const time = (d: Date | undefined) => (d instanceof Date ? d.getTime() : 0);

export function planCourses<F extends FolderLike>(
  input: CoursesInput<F>,
  collections: Collection[],
  now = new Date(),
): CoursesPlan<F> {
  const courses = [...(input.courses ?? [])];
  const known = new Set(courses.map((c) => c.id));
  let coursesChanged = false;

  const ensureCourse = (code: string, language: string | undefined) => {
    if (known.has(code)) return;
    known.add(code);
    courses.push({ id: code, voice: voiceFor(code, language), addedAt: now });
    coursesChanged = true;
  };

  // 1. Наборы: у каждого должен быть существующий курс
  const courseOf = new Map<string, string>();
  for (const c of collections) {
    const code = c.courseId ?? courseCodeFromLanguage(c.language);
    ensureCourse(code, c.language);
    courseOf.set(c.id, code);
  }

  // 2. Активный курс: прежний, если жив; иначе курс последнего изученного набора, иначе самого большого
  let activeCourseId = input.activeCourseId && known.has(input.activeCourseId) ? input.activeCourseId : null;
  if (!activeCourseId && courses.length > 0) {
    const studied = [...collections].sort((a, b) => time(b.lastStudied) - time(a.lastStudied))[0];
    if (studied && time(studied.lastStudied) > 0) {
      activeCourseId = courseOf.get(studied.id) ?? null;
    } else {
      const size = new Map<string, number>();
      for (const c of collections) size.set(courseOf.get(c.id)!, (size.get(courseOf.get(c.id)!) ?? 0) + c.cards.length);
      activeCourseId = [...courses].sort((a, b) => (size.get(b.id) ?? 0) - (size.get(a.id) ?? 0))[0].id;
    }
  }

  // 3. Папки: курс большинства их наборов; пустые — активному курсу
  let foldersChanged = false;
  const folders = (input.folders ?? []).map((f) => {
    if (f.courseId && known.has(f.courseId)) return f;
    const votes = new Map<string, number>();
    for (const c of collections) {
      if (c.folderId !== f.id) continue;
      const code = courseOf.get(c.id)!;
      votes.set(code, (votes.get(code) ?? 0) + 1);
    }
    const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? activeCourseId;
    if (!winner) return f; // курсов ещё нет — папка подождёт первого курса
    foldersChanged = true;
    return { ...f, courseId: winner };
  });

  // 4. Набор не может лежать в папке чужого курса или в несуществующей папке — иначе он не виден
  const folderCourse = new Map(folders.map((f) => [f.id, f.courseId]));
  const collectionUpdates: CoursesPlan<F>["collectionUpdates"] = [];
  for (const c of collections) {
    const code = courseOf.get(c.id)!;
    const clearFolder = Boolean(c.folderId) && folderCourse.get(c.folderId!) !== code;
    if (c.courseId !== code || clearFolder) collectionUpdates.push({ id: c.id, courseId: code, clearFolder });
  }

  const profileChanged =
    coursesChanged ||
    foldersChanged ||
    activeCourseId !== (input.activeCourseId ?? null) ||
    (courses.length > 0 && input.coursesVersion !== COURSES_VERSION);

  return { courses, activeCourseId, folders, collectionUpdates, profileChanged };
}
