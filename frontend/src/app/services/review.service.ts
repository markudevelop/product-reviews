import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Review, CreateReviewPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  createReview(productId: string, payload: CreateReviewPayload): Observable<Review> {
    return this.http.post<Review>(
      `${environment.apiUrl}/products/${productId}/reviews`,
      payload,
    );
  }

  updateReview(
    productId: string,
    reviewId: string,
    payload: Partial<CreateReviewPayload>,
  ): Observable<Review> {
    return this.http.put<Review>(
      `${environment.apiUrl}/products/${productId}/reviews/${reviewId}`,
      payload,
    );
  }

  deleteReview(productId: string, reviewId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/products/${productId}/reviews/${reviewId}`,
    );
  }
}
