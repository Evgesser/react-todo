import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  email?: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt?: Date;
}
