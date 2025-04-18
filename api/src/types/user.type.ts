export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  role: "admin" | "customer";
  createdAt: Date;
  updatedAt: Date;
}
