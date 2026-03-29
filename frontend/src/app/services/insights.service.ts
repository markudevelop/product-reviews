import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface ReviewInsight {
  productId: string;
  productName: string;
  summary: string;
  pros: string[];
  cons: string[];
  sentiment: 'positive' | 'mixed' | 'negative';
  averageRating: number;
  reviewCount: number;
  generatedAt: string;
  source: 'llm' | 'heuristic';
}

@Injectable({ providedIn: 'root' })
export class InsightsService {
  constructor(private http: HttpClient) {}

  getInsights(productId: string): Observable<ReviewInsight> {
    return this.http.get<ReviewInsight>(
      `${environment.apiUrl}/products/${productId}/insights`,
    );
  }
}
