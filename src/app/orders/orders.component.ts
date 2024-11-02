import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Order } from '../create-order/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, ReactiveFormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  private readonly orderService: OrderService = inject(OrderService)
  searchTerm = new FormControl('')
  orders: Order[]=[];

  constructor(private router: Router){

  }


  ngOnInit(): void {
    this.getOrders();
    //Hay que subscribirse a los filtros para ver los cambios
    //this.filterOrders().subscribe()
  }

  getOrders(){
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders = response;
      },
      error: (err) => {
        console.error('Error:', err);
      }
    })
  }

  toNew(){
    this.router.navigate(['/create-order']);
  }

  //Filtro
  filterOrders(){
    if(!this.searchTerm.value){
      this.getOrders();
    }
    return this.searchTerm.valueChanges.subscribe(searchTerm =>{
      this.orders.filter(order => {
        order.customerName.toLowerCase().includes(this.searchTerm.value ?? '') ||
        order.email.toLowerCase().includes(this.searchTerm.value ?? '')
      })
    })
  }

}
