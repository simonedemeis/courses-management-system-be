export type UserNoPasswordAndId = {
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
}

export type Role = 'admin' | 'user';

export type Register = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export type Login =  {
    email: string;
    password: string;
}

type AddRole = {
    role?: string;
}

export type User = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    refreshToken?: string;
} & AddRole

export type Category = {
    id: number;
    name: string;
}

export type Course = {
    id: number;
    title: string;
    description: string;
    duration: number;
    category: Category;
}

export type AddCourseRequest = {
    id: number;
    title: string;
    description: string;
    duration: number;
    category: number;
}

export type CourseCreateModel = {
    id: number;
    title: string;
    description: string;
    duration: number;
    categoryId: number;
}

export type CourseUpdateModel = {
    title: string;
    description: string;
    duration: number;
    categoryId: number;
}
