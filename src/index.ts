import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "dotenv";
import {
  Register,
  Login,
  AddCourseRequest,
  CourseUpdateModel,
} from "./lib/interfaces.ts";
import {
  login,
  register,
  getUsers,
  refreshToken as refreshTokenFunc,
} from "./services/userService.ts";
import {
  verifyUserAuthentication,
  verifyUserAuthorization,
} from "./services/authService.ts";
import {
  addCourse,
  editCourse,
  deleteCourse,
  getCourses,
  getCourseById,
} from "./services/courseService.ts";
import { getCategories } from "./services/categoryService.ts";
import { logger } from "./services/loggerService.ts";
import cookieParser from "cookie-parser";

logger.info("Starting application...");

config();

const app = express();
const port = 3000;

app.use(
  "/api",
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser())
// Middleware autenticazione
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

  const authenticated = verifyUserAuthentication(token);

  if (!authenticated) {
    logger.error("User not authenticated");
    res.status(401).json({ message: "Unauthorized!" });
    return;
  }

  logger.info("User authenticated");

  next();
};

// Middleware autorizzazione
const authorize = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");

  verifyUserAuthorization(token)
    .then((authorized: boolean) => {
      if (!authorized) {
        logger.error("User not authorized");
        res.status(403).json({ message: "Forbidden!" });
        return;
      }

      logger.info("User authorized");

      next();
    })
    .catch(() => {
      logger.fatal(
        "Internal server error during user authorization verification"
      );
      return res.status(500).json({ message: "Internal server error" });
    });
};

// REGISTER
app.post("/api/register", (req: Request, res: Response) => {
  const request: Register = req.body;

  register(request)
    .then((result: any) => {
      if (!result) {
        logger.error("User registration error");
        return res.status(400).json({ message: "Bad request!" });
      }
      logger.info("User created successfully!");
      res.status(201).json({ message: "User created successfully!" });
    })
    .catch(() => res.status(500).json({ message: "Internal server error" }));
});

// LOGIN
app.post("/api/login", (req: Request, res: Response) => {
  const request: Login = req.body;

  login(request)
    .then((token: any) => {
      if (!token) {
        logger.error("User login error");
        return res.status(400).json({ message: "Bad request!" });
      }

      // Imposta il refreshToken come cookie HttpOnly
      res.cookie("refreshToken", token.refreshToken, {
        httpOnly: true,
        secure: false, // usa HTTPS in produzione
        sameSite: "lax", // oppure "Lax" se serve compatibilità
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
      });

      logger.info("Login success!");

      // Ritorna solo l'accessToken nel body
      setTimeout(() => {
        return res.status(200).json({
          message: "Login success!",
          accessToken: token.accessToken,
        });
      }, 3000);
    })
    .catch((e) => {
      logger.error("Login exception: " + e.message);
      res.status(500).json({ message: e.message });
    });
});


// GET USERS (admin)
app.get("/api/admin/users", authorize, (_req: Request, res: Response) => {
  getUsers()
    .then((users: any) => {
      if (!users) {
        logger.error("Users list get error");
        return res.status(400).json({ message: "Bad request!" });
      }
      logger.info("Users list get success");

      setTimeout(() => {
        return res.status(200).json(users);
      }, 3000);
    })
    .catch(() => res.status(500).json({ message: "Internal server error" }));
});

// GET COURSES
app.get("/api/courses", authenticate, (_req: Request, res: Response) => {
  getCourses()
    .then((courses: any) => {
      if (!courses) {
        logger.error("Courses list get error");
        return res.status(400).json({ message: "Bad request!" });
      }
      logger.info("Courses list get success");
      setTimeout(() => {
        return res.status(200).json(courses);
      }, 3000);
    })
    .catch(() => res.status(500).json({ message: "Internal server error" }));
});

// DELETE COURSE
app.delete(
  "/api/courses/delete/:id",
  authorize,
  (req: Request, res: Response) => {
    const id = req.params.id;

    deleteCourse(id)
      .then((result: any) => {
        if (!result) {
          logger.error("Course deletion error");
          return res.status(400).json({ message: "Bad request!" });
        }
        logger.info("Course deleted successfully!");
        res.status(200).json({ message: "Course deleted successfully!" });
      })
      .catch(() => res.status(500).json({ message: "Internal server error" }));
  }
);

// ADD COURSE
app.post("/api/courses", authorize, (req: Request, res: Response) => {
  const request: AddCourseRequest = req.body;

  addCourse(request)
    .then((result: any) => {
      if (!result) {
        logger.error("Course add error");
        return res.status(400).json({ message: "Bad request!" });
      }
      logger.info("Course created successfully!");
      res.status(201).json({ message: "Course created successfully!" });
    })
    .catch(() => res.status(500).json({ message: "Internal server error" }));
});

// GET CATEGORIES
app.get(
  "/api/courses/categories",
  authenticate,
  (_req: Request, res: Response) => {
    getCategories()
      .then((categories: any) => {
        if (!categories) {
          logger.error("Categories list get error");
          return res.status(400).json({ message: "Bad request!" });
        }
        logger.info("Categories list get success");
        return res.status(200).json(categories);
      })
      .catch(() => res.status(500).json({ message: "Internal server error" }));
  }
);

// GET COURSE BY ID
app.get("/api/courses/:id", authenticate, (req: Request, res: Response) => {
  const id = req.params.id;

  getCourseById(id)
    .then((course: any) => {
      if (!course) {
        logger.error("Course get error");
        return res.status(400).json({ message: "Bad request!" });
      }
      logger.info("Course get success");
      res.status(200).json(course);
    })
    .catch(() => res.status(500).json({ message: "Internal server error" }));
});

// UPDATE COURSE
app.put("/api/courses/update/:id", authorize, (req: Request, res: Response) => {
  const id = req.params.id;
  const request: CourseUpdateModel = req.body;

  if (!id) {
    logger.error("No course id provided");
    res.status(400).json({ message: "Bad request!" });
    return;
  }

  editCourse(id, request)
    .then((result: any) => {
      if (!result) {
        logger.error("Course update error");
        return res.status(400).json({ message: "Bad request!" });
      }
      logger.info("Course update success");
      res.status(200).json({ message: "Course updated successfully!" });
    })
    .catch(() => res.status(500).json({ message: "Internal server error" }));
});

app.post("/api/refresh-token", (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken; 

  if (!refreshToken) {
    logger.error("No refresh token provided in cookie");
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  refreshTokenFunc(refreshToken)
    .then((result) => {
      if (!result.success) {
        logger.error("Unsuccessful token refresh");
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      logger.info("Token refreshed successfully");

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: false, // o false in sviluppo
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Ritorna solo il nuovo access token
      return res.status(200).json({
        message: "Refresh token success!",
        accessToken: result.accessToken,
      });
    })
    .catch(() => {
      res.status(500).json({ message: "Internal server error" });
    });
});

app.post("/api/logout", (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  logger.info("User logged out, refresh token cookie cleared");
  res.status(200).json({ message: "Logout successful" });
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
