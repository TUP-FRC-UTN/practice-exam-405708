import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AsyncValidatorFn, ControlContainer, Form, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
  descuento:boolean = false;
  total = 0;
  private orderService:OrderService = inject(OrderService);
  private readonly router = inject(Router)

  //Yo calculo el total
  reactiveForm:FormGroup = new FormGroup({
    customerName: new FormControl("", [Validators.required, Validators.minLength(3)]),
    email: new FormControl("", [Validators.required, Validators.email]), //Validar API
    products: new FormArray([],[Validators.required, this.uniqueProductValidator]) //Validacion Sincronica
  })


  get products() {
    return this.reactiveForm.controls["products"] as FormArray;
  }

  onNewEvent() {
    const formArray = this.reactiveForm.controls["products"] as FormArray;
    const eventForm = new FormGroup({
      productId: new FormControl("", [Validators.required]), //Select API
      name: new FormControl(""),
      quantity: new FormControl("", [Validators.required, Validators.min(0), Validators.max(50)]),//Falta el max(stock)
      price: new FormControl("", [Validators.required]), // Inicializado como deshabilitado
      stock: new FormControl("", [Validators.required]) // Inicializado como deshabilitado
    });

    //Me suscribo al cambio de valor del name, para actualizar los otros campos
    eventForm.get("productId")?.valueChanges.subscribe((selectedValue) => {
      this.updatePriceAndStock(eventForm, selectedValue);
      this.calculateTotal()
    });

    eventForm.get("quantity")?.valueChanges.subscribe((selectedValue) => {
      this.calculateTotal()
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
    eventForm.get("name")?.setValue(selectedProduct.name);
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

  //COMPLETAR
  generatedCode: string = "defaultCode";
  generateCode(){
    /*const emailSuffix = email.slice(-4);
    const timestamp = "";*/
    return this.generatedCode;
  }

  save(){
    const generatedOrderCode = this.generateCode()
    const orderData:Order = {
      id: "21",
      customerName: this.reactiveForm.value.customerName,
      email: this.reactiveForm.value.email,
      products: this.reactiveForm.value.products,
      total: 0,
      orderCode:generatedOrderCode,
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



  //Retorna una clase para poner el input en verde o rojo dependiendo si esta validado
  onValidate(controlName: string) {
    const control = this.reactiveForm.get(controlName);
    return {
      'is-invalid': control?.invalid && (control?.dirty || control?.touched),
      'is-valid': control?.valid
    }
  }

  //Utilizar
  uniqueProductValidator(products: FormArray): ValidationErrors | null{
    const selectedProductId = products.controls.map(control =>
      control.get('productId')?.value as Number);
    const hasDuplicates = selectedProductId.some((id, index) => 
      selectedProductId.indexOf(id) !==index
    );
    return hasDuplicates ? { duplicateProduct:true } : null
  }

  calculateTotal(): void{
    let subtotal = 0;

    this.products.controls.forEach(control =>{
      const quantity = control.get('quantity')?.value || 0;
      const price = control.get('price')?.value || 0;
      subtotal += quantity * price
    })
    this.descuento = subtotal > 1000

    this.total = this.descuento ? subtotal * 0.9 : subtotal;
  }


  
  /*
  VER DEL REPO DEL PROFE
  https://github.com/TUP-FRC-UTN/practice-exam-class
  2.3 Validación Asincrónica del Email
      Implementar un validador asincrónico personalizado para el campo email que:
      Utilice el endpoint GET /orders?email={email} para verificar el historial de pedidos
      Valide que el cliente no haya realizado más de 3 pedidos en las últimas 24 horas  
  
  //Cuando lo ponemos en el formControl:
  nuevo [] por las Async

  emailOrderLimitValidator(): AsyncValidatorFn | null{
    //return

    //sub al service
    //mapear lista de ordenes
    //comparar lo del dia 3 maximo por dia
  }
  */
   //TODO:
  /*
    2.0 Cantidad (no exceder stock)

    2.1 Implementar validación:
      La cantidad total de productos no debe exceder 10 unidades


      5. Algoritmo de Procesamiento
    Implementar:
    Valide que hay stock suficiente para cada producto
    Genere un código único para el pedido basado en: primera letra del nombre del cliente + últimos 4 caracteres del email + timestamp
    Por cada producto nuevo debe agregar una fecha de compra al producto
    Debe validar que el usuario no pueda realizar más de tres pedidos en las últimas 24 horas utilizando el endpoint de filtrado por email
  */

}
