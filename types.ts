
export type Role = 'ADMIN' | 'COACH';

export type UserStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  password?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  image_url: string;
  tags: string[];
}

export interface Exercise {
  id: string;
  title: string;
  type: string;
  agegroup: string;
  playerscount: string;
  shortdescription: string;
  detailedinstructions: string;
  image?: string;
  tags: string[];
  created_at: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  duration: string;
  date: string;
}

export type ViewState = 
  | 'LANDING' 
  | 'DASHBOARD' 
  | 'EXERCISES' 
  | 'CREATE_EXERCISE' 
  | 'EDIT_EXERCISE' 
  | 'BLOG' 
  | 'VIEW_ARTICLE'
  | 'CREATE_ARTICLE'
  | 'EDIT_ARTICLE'
  | 'PODCASTS' 
  | 'ADMIN_USERS' 
  | 'SET_PASSWORD';
