import jwt, { type JwtPayload } from "jsonwebtoken";
import { type UserNoPasswordAndId } from "../lib/types.ts";
import { users } from "../drizzle/schema.ts";
import { db } from "../drizzle/database.ts";
import { eq } from "drizzle-orm";

export async function generateToken(
  payload: UserNoPasswordAndId,
) {

  const user = await db.query.users.findFirst({
    where: eq(users.email, payload.email),
  });

  if (!user) {
    return "";
  }

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN as string) }
  );

  const result = await db
    .update(users)
    .set({ refresh_token: refreshToken })
    .where(eq(users.id, user.id));

  if (result.rowsAffected == 0) {
    return "";
  }

  const accessToken = jwt.sign(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      role: payload.role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN as string), issuer: 'CoursesManagementSystemBE', subject: user.id.toString(), audience: 'CoursesManagementSystemBE' }
  );

  return {
    accessToken,
    refreshToken,
  };
}

export function verifyUserAuthentication(token: string | undefined) {
  try {
    if (!token) {
      return false;
    }
    const sanitizedToken = token.split(" ")[1];
    return jwt.verify(sanitizedToken, process.env.JWT_SECRET as string);
  } catch {
    return false;
  }
}

export function verifyUserAuthorization(token: string | undefined) {
  try {
    const decodedToken = verifyUserAuthentication(token) as JwtPayload;

    if (!decodedToken) {
      return Promise.resolve(false);
    }

    return db.query.users
      .findFirst({
        where: eq(users.email, decodedToken.email),
      })
      .then((user) => {
        if (!user || user.role !== "admin") {
          return false;
        }
        return true;
      })
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}
