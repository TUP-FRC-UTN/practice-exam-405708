import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor() { }

  private readonly http: HttpClient = inject(HttpClient);
  private readonly url = 'http://localhost:3000'

  getProducts(){
    return this.http.get<any>(this.url + '/products')
  }

  getOrders(){
    return this.http.get<any>(this.url + '/orders')
  }

  post(dataOrder:any){
    return this.http.post<any>(this.url + '/orders' , dataOrder)
  }

  getOrdersByEmail(email:string){
    return this.http.get<any>(this.url + `/orders?email=${email}`)
  }
}
