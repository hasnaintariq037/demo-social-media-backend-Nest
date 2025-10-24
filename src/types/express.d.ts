import { UserDocument } from "src/user/schemas/user.schema"; // adjust path if needed

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}
