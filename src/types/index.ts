export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  director: string;
  actors: string[];
  genre: string;
  duration: number;
  releaseDate: string;
  poster?: string;
  trailer?: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  totalRooms: number;
  logo?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  movieId: string;
  cinemaId: string;
  movie?: Movie;
  cinema?: Cinema;
  room: string;
  showTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  scheduleId: string;
  user?: User;
  schedule?: Schedule;
  seats: string[];
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  movieId: string;
  user?: User;
  movie?: Movie;
  content: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  image?: string;
  excerpt?: string;
  authorId: string;
  author?: User;
  isPublished: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

