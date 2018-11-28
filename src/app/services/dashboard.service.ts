import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  url: string = 'http://localhost:8080/api/dashboards';
  sseUrl: string = 'http://localhost:8080/api/sse/dashboards';

  constructor(private httpClient: HttpClient) { }

  getDashboards(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.url);
  }

  getDashboard(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.url}/${id}`);
  }

  saveDashboard(dashboard: any) {
    return this.httpClient.post(this.url, dashboard, httpOptions);
  }

  updateDashboard(dashboard: any): Observable<any> {
    return this.httpClient.put(this.url, dashboard, httpOptions);
  }

  deleteDashboard(id: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.url}/${id}`);
  }

}