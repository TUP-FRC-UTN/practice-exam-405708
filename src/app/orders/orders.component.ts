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
  searchTerm = new FormControl('');
  orders: Order[] = [];
  allOrders: Order[] = []; // Lista completa de órdenes

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.getOrders();
    this.filterOrders(); // Llamada para suscribirse a los cambios en el input
  }

  getOrders() {
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders = response;
        this.allOrders = response; // Copia de la lista completa
      },
      error: (err) => {
        console.error('Error:', err);
      }
    });
  }

  toNew() {
    this.router.navigate(['/create-order']);
  }

  filterOrders() {
    this.searchTerm.valueChanges.subscribe(searchTerm => {
      if (searchTerm === null || searchTerm.trim() === '') {
        // Si el término de búsqueda está vacío, mostramos todas las órdenes
        this.orders = [...this.allOrders];
      } else {
        // Filtramos las órdenes basándonos en el término de búsqueda
        const lowerCaseTerm = searchTerm.toLowerCase();
        this.orders = this.allOrders.filter(order => 
          order.customerName.toLowerCase().includes(lowerCaseTerm) ||
          order.email.toLowerCase().includes(lowerCaseTerm)
        );
      }
    });
  }

}
