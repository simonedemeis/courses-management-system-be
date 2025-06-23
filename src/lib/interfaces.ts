export interface Register {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface Login {
    email: string;
    password: string;
}

interface AddRole {
    role?: string;
}

export interface User extends AddRole {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    refreshToken?: string;
}

export interface Category{
    id: number;
    name: string;
}

export interface Course {
    id: number;
    title: string;
    description: string;
    duration: number;
    category: Category;
}

export interface AddCourseRequest{
    id: number;
    title: string;
    description: string;
    duration: number;
    category: number;
}

export interface CourseCreateModel{
    id: number;
    title: string;
    description: string;
    duration: number;
    categoryId: number;
}

export interface CourseUpdateModel{
    title: string;
    description: string;
    duration: number;
    categoryId: number;
}