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

// shape returned by /api/user and used on client
export interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}
