import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateFinancialRecordRequest,
  FinanceDashboard,
  FinancialRecord,
  FinancialRecordQuery
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/finance`;

  getDashboard(): Observable<FinanceDashboard> {
    return this.http.get<FinanceDashboard>(`${this.base}/dashboard`);
  }

  getRecords(query: FinancialRecordQuery): Observable<FinancialRecord[]> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<FinancialRecord[]>(`${this.base}/records`, { params });
  }

  createRecord(request: CreateFinancialRecordRequest): Observable<FinancialRecord> {
    return this.http.post<FinancialRecord>(`${this.base}/records`, request);
  }

  deleteRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/records/${id}`);
  }
}
