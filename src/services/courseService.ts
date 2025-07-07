import { eq } from "drizzle-orm";
import { db } from "../drizzle/database.ts";
import { courses } from "../drizzle/schema.ts";
import {
  type AddCourseRequest,
  type Course,
  type CourseUpdateModel,
} from "../lib/types.ts";
import { z } from "zod";

export async function getCourses(): Promise<Course[]> {

  const courses = await db.query.courses.findMany({
    with: {
      category: true
    }
  })

  return courses;
}

export async function addCourse(request: AddCourseRequest): Promise<boolean> {
  const addCourseRequest = z
    .object({
      title: z.string().min(2).max(20),
      description: z.string().min(2).max(200),
      duration: z.coerce.number().min(1),
      category: z.coerce.number().min(1),
    })
    .required();

  const validated = await addCourseRequest.safeParseAsync(request);

  let course = undefined;

  if (!validated.success) {
    return false;
  }

  try {

    course = await db.insert(courses).values({
        title: validated.data.title,
        description: validated.data.description,
        duration: validated.data.duration,
        category_id: validated.data.category,
    })

    if(course?.rowsAffected == 0){
      return false;
    }

  } catch {
    return false;
  }

  return true;
}

export async function getCourseById(id: string) {
  const validateId = z.coerce.number().min(1);

  const validatedId = await validateId.safeParseAsync(id);

  if (!validatedId.success) {
    return false;
  }

  const numId: number = validatedId.data;

  const course = db.query.courses.findFirst({
    where: eq(courses.id, numId),
    with: {
      category: true
    }
  })

  if (!course) {
    return false;
  }

  return course;
}

export async function deleteCourse(id: string) {
  const validateId = z.coerce.number().min(1);

  const validatedId = await validateId.safeParseAsync(id);

  if (!validatedId.success) {
    return false;
  }

  const numId: number = validatedId.data;

  const course = await db.delete(courses).where(eq(courses.id, numId))

  if (course?.rowsAffected == 0) {
    return false;
  }

  return true;
}

export async function editCourse(id: string, course: CourseUpdateModel) {
  const updateCourseRequest = z
    .object({
      title: z.string().min(2).max(20),
      description: z.string().min(2).max(200),
      duration: z.coerce.number().min(1),
      categoryId: z.coerce.number().min(1),
    })
    .required();

  const validateId = z.coerce.number().min(1);

  const validatedId = await validateId.safeParseAsync(id);

  const validatedRequest = await updateCourseRequest.safeParseAsync(course);

  if (!validatedId.success || !validatedRequest.success) {
    return false;
  }

  const numId: number = validatedId.data;

  const updatedCourse = await db.update(courses).set({
    title: validatedRequest.data.title,
    description: validatedRequest.data.description,
    duration: validatedRequest.data.duration,
    category_id: validatedRequest.data.categoryId,
  })
  .where(eq(courses.id, numId))

  if (updatedCourse?.rowsAffected == 0) {
    return false;
  }

  return true;
}
