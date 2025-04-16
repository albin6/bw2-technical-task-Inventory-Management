export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "staff";
  createdAt: Date;
  updatedAt: Date;
}
