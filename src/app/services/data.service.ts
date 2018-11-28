import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  url: string = 'http://localhost:8080/api/data/all';

  constructor(private httpClient: HttpClient) { }

  getDataSSE(): Observable<any[]> {
    return Observable.create((observer) => {
      let eventSource = new EventSource(this.url + '/sse');
      eventSource.onmessage = (event) => {
        let data = JSON.parse(event.data);
        observer.next(data);
      };
      eventSource.onerror = (error) => {
        if(eventSource.readyState === 2) {
          console.log('The stream has been closed by the server');
          eventSource.close();
          observer.complete();
        }
      };
    });
  }

  getData(): Observable<any[]> {
    return this.httpClient.get<any[]>(this.url);
  }

}