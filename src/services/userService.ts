import { z } from "zod";
import { type Login, type Register } from "../lib/types.ts";
import { type Role } from "../lib/types.ts";
import { generateToken } from "./authService.ts";
import { type UserNoPasswordAndId } from "../lib/types.ts";
import jwt from "jsonwebtoken";
import { db } from "../drizzle/database.ts";
import { users } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/utils.ts";

export async function validateRegisterRequest(request: Register) {

  const registerRequest = z
    .object({
      firstName: z.string().min(2).max(20),
      lastName: z.string().min(2).max(20),
      email: z.string().min(6).email(),
      password: z
        .string()
        .min(12)
        .max(18)
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,18}$/),
    })
    .required();

  const validatedRequest = await registerRequest.safeParseAsync(request);

  if (!validatedRequest.success) {
    return false;
  }

  // const passwordHash = await argon2.hash(validatedRequest.data.password);
  const passwordHash = await hashPassword(validatedRequest.data.password);

  const reqWithHashedPasswordAndRole: Register & { role: Role } = {
    firstName: validatedRequest.data.firstName,
    lastName: validatedRequest.data.lastName,
    email: validatedRequest.data.email,
    password: passwordHash,
    role: "user",
  };

  return reqWithHashedPasswordAndRole;
}

export async function validateLoginRequest(request: Login) {
  const loginRequest = z
    .object({
      email: z.string().min(6).email(),
      password: z.string().min(12).max(18),
    })
    .required();

  const validatedRequest = await loginRequest.safeParseAsync(request);

  if (!validatedRequest.success) {
    return false;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, validatedRequest.data.email),
  });

  if (!user) {
    return false;
  }

  const passwordVerified = await verifyPassword(validatedRequest.data.password, user.password);

  if (!passwordVerified) {
    return false;
  }

  const userNoPasswordAndId: UserNoPasswordAndId = {
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
  };

  return userNoPasswordAndId;
}

export async function register(request: Register) {
  const validationResult = await validateRegisterRequest(request);

  if (!validationResult) {
    return false;
  }

  const { firstName, lastName, email, password, role } = validationResult;

  let user;

  try {
    await db.insert(users).values({
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      role: role,
    });

    user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  } catch (error: unknown) {
    return false;
  }

  if (!user) {
    return false;
  }

  return true;
}

export async function login(request: Login) {
  const validationResult = await validateLoginRequest(request);

  if (!validationResult) {
    return false;
  }

  const token = await generateToken(validationResult);

  return token;
}

export async function getUsers() {
  const users = await db.query.users.findMany();

  if (users.length === 0) {
    return false;
  }

  return users;
}

export async function refreshToken(
  refreshToken: string
): Promise<{ success: boolean; accessToken: string; refreshToken: string }> {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as { userId: number };

    return db.query.users
      .findFirst({ where: eq(users.id, decoded.userId) })
      .then((user: any) => {
        if (!user || user.refresh_token !== refreshToken) {
          return {
            success: false,
            accessToken: "",
            refreshToken: "",
          };
        }

        console.log(user)

        const newAccessToken = jwt.sign(
          {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
          },
          process.env.JWT_SECRET as string,
          { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN as string), issuer: 'CoursesManagementSystemBE', subject: user.id.toString(), audience: "CoursesManagementSystemFE" }
        );

        const newRefreshToken = jwt.sign(
          { userId: user.id },
          process.env.REFRESH_TOKEN_SECRET as string,
          { expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN as string) }
        );

        return db
          .update(users)
          .set({ refresh_token: newRefreshToken })
          .where(eq(users.id, user.id))
          .then(() => ({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }));
      })
      .catch(() => ({
        success: false,
        accessToken: "",
        refreshToken: "",
      }));
  } catch (err) {
    return Promise.resolve({
      success: false,
      accessToken: "",
      refreshToken: "",
    });
  }
}
