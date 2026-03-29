import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Product, ProductDetail, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly url = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
    search?: string;
  } = {}): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PaginatedResponse<Product>>(this.url, { params: httpParams });
  }

  getProduct(id: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.url}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/categories`);
  }
}
