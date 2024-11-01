import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Form, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';
import { timestamp } from 'rxjs';
import { Order, Product } from './order';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent {
  isDisabled:boolean = true;
  private orderService:OrderService = inject(OrderService);
  private readonly router = inject(Router)

  //Yo calculo el total
  reactiveForm:FormGroup = new FormGroup({
    customerName: new FormControl("", [Validators.required, Validators.minLength(3)]),
    email: new FormControl("", [Validators.required, Validators.email]), //Validar API
    products: new FormArray([])
  })

  //TODO:
  /*
    2.0 Cantidad (número, mayor a 0, no exceder stock)

    2.1 Implementar validación:
      El pedido debe tener al menos un producto
      La cantidad total de productos no debe exceder 10 unidades
  

    2.2 Validación Sincrónica Personalizada
      Implementar un validador sincrónico personalizado para el FormArray de productos que:
      Valide que no existan productos duplicados en el pedido
      Debe implementarse usando la siguiente estructura:
      La validación debe:
        Activarse cada vez que se agrega o modifica un producto en el FormArray
        Retornar el mensaje si hay productos repetidos

    2.3 Validación Asincrónica del Email
      Implementar un validador asincrónico personalizado para el campo email que:
      Utilice el endpoint GET /orders?email={email} para verificar el historial de pedidos
      Valide que el cliente no haya realizado más de 3 pedidos en las últimas 24 horas  



    5. Algoritmo de Procesamiento
    Implementar:
    Calcule el total del pedido aplicando un descuento del 10% si el total supera $1000
    Valide que hay stock suficiente para cada producto
    Genere un código único para el pedido basado en: primera letra del nombre del cliente + últimos 4 caracteres del email + timestamp
    Por cada producto nuevo debe agregar una fecha de compra al producto
    Debe validar que en la lista de productos el usuario no seleccione dos productos iguales
    Debe validar que el usuario no pueda realizar más de tres pedidos en las últimas 24 horas utilizando el endpoint de filtrado por email
  */

  get products() {
    return this.reactiveForm.controls["products"] as FormArray;
  }

  onNewEvent() {
    const formArray = this.reactiveForm.controls["products"] as FormArray;
    const eventForm = new FormGroup({
      name: new FormControl("", [Validators.required]), //Select API
      quantity: new FormControl("", [Validators.required, Validators.min(0)]),//Falta el max(stock)
      price: new FormControl("", [Validators.required]), // Inicializado como deshabilitado
      stock: new FormControl("", [Validators.required]) // Inicializado como deshabilitado
    });

    //Me suscribo al cambio de valor del name, para actualizar los otros campos
    eventForm.get("name")?.valueChanges.subscribe((selectedValue) => {
      this.updatePriceAndStock(eventForm, selectedValue);
    });

    formArray.push(eventForm);
    this.chargeSelect()
  }

  //Metodo cuando cambie el valor del select para asignar valores a stock y price
  updatePriceAndStock(eventForm: FormGroup, selectedProductId: string | null) {
  // Encuentra el producto en el array `selectProducts`
  const selectedProduct = this.selectProducts.find(product => product.id === selectedProductId);

  if (selectedProduct) {
    // Actualiza los valores de `price` y `stock`
    eventForm.get("price")?.setValue(selectedProduct.price);
    eventForm.get("stock")?.setValue(selectedProduct.stock);
  }
}

  selectProducts:any[] = [];
  chargeSelect(){
    this.orderService.getProducts().subscribe({
      next: (response) => {
        this.selectProducts = response;
      },
      error: (err) => {
        console.error('Error:', err);
      }
    })
  }

  onDeleteEvent(index: number) {
    this.products.removeAt(index);
  }

  save(){

    const orderData:Order = {
      id: "Id",
      customerName: this.reactiveForm.value.customerName,
      email: this.reactiveForm.value.email,
      products: this.reactiveForm.value.products,
      total: 0,
      orderCode:"131Ci13",
      timestamp: new Date().toDateString()
    }

    orderData.products.forEach((product: Product) => {
      orderData.total += product.price * product.quantity;
    });

    this.orderService.post(orderData).subscribe({
      next: (response) => {
        console.log('Orden enviada correctamente', response);
        this.router.navigate(['/orders']);
      },
      error: (error) => {
        console.error('Error al enviar la orden', error);
      }
    });
  }


}
