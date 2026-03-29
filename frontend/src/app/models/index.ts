export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  price: number;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  reviews: Review[];
  ratingDistribution: RatingBucket[];
}

export interface RatingBucket {
  stars: number;
  count: number;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  body: string;
}
