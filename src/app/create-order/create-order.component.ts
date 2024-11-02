import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ControlContainer, Form, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, timestamp } from 'rxjs';
import { Order, Product } from './order';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent implements OnInit {
  isDisabled:boolean = true;
  descuento:boolean = false;
  total = 0;
  maxstock =40;
  productsQuantity = 0;
  private orderService:OrderService = inject(OrderService);
  private readonly router = inject(Router)

  //Yo calculo el total
  reactiveForm:FormGroup = new FormGroup({
    customerName: new FormControl("", [Validators.required, Validators.minLength(3)]),
    email: new FormControl("", [Validators.required, Validators.email]), //Validar API
    products: new FormArray([],[Validators.required, this.uniqueProductValidator, Validators.maxLength(10)]) //Validacion Sincronica
  })

  ngOnInit(): void {
  this.reactiveForm.get('email')?.setAsyncValidators(this.emailOrderLimitValidator());  
  }

  get products() {
    return this.reactiveForm.controls["products"] as FormArray;
  }

  onNewEvent() {
    const formArray = this.reactiveForm.controls["products"] as FormArray;
    const eventForm = new FormGroup({
      productId: new FormControl("", [Validators.required]), //Select API
      name: new FormControl(""),
      quantity: new FormControl("", [Validators.required, Validators.min(0), Validators.max(120)]),//Falta el max(stock)
      price: new FormControl("", [Validators.required]), // Inicializado como deshabilitado
      stock: new FormControl("", [Validators.required]) // Inicializado como deshabilitado
    });

    //Me suscribo al cambio de valor del name, para actualizar los otros campos
    eventForm.get("productId")?.valueChanges.subscribe((selectedValue) => {
      this.updatePriceAndStock(eventForm, selectedValue);
      this.calculateTotal();
    });

    eventForm.get("quantity")?.valueChanges.subscribe((selectedValue) => {
      this.calculateTotal();
    });

    this.productsQuantity = this.productsQuantity + 1;
    formArray.push(eventForm);
    this.chargeSelect()
  }

  
  onDeleteEvent(index: number) {
    this.products.removeAt(index);
    this.productsQuantity = this.productsQuantity - 1;
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

    //METODO PARA ACTUALIZAR MAX DE STOCK
    this.maxstock = selectedProduct.stock
    const quantityControl = eventForm.get('quantity');
    // Actualiza el validador 'max' del campo 'quantity' 
    //con el valor actual de 'stock'
    quantityControl?.setValidators([
      Validators.required,
      Validators.min(0),
      Validators.max(this.maxstock) // Setea el stock como valor máximo
    ]);

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


  //COMPLETAR
  generatedCode: string = "defaultCode";
  generateCode(){
    //Genere un código único para el pedido basado en: 
    //Toma la primera letra y la hace Mayus
    const initialOfName = this.reactiveForm.value.customerName.charAt(0).toUpperCase()
    //Toma las ultimas 4 letras el correo
    const emailSuffix = this.reactiveForm.value.email.slice(-4);
    // Genera el timestamp en segundos
    const timestamp = Math.floor(Date.now() / 1000);

    // Combinar para el formato que quiero
    this.generatedCode = `${initialOfName}${emailSuffix}${timestamp}`;
    return this.generatedCode;
  }

  save(){
    const generatedOrderCode = this.generateCode()
    const orderData:Order = {
      id: "21",
      customerName: this.reactiveForm.value.customerName,
      email: this.reactiveForm.value.email,
      products: this.reactiveForm.value.products,
      total: this.total,
      orderCode:generatedOrderCode,
      timestamp: new Date().toISOString()
    }


    this.orderService.post(orderData).subscribe({
      next: (response) => {
        console.log('Orden enviada correctamente', response);
        this.total = 0;
        this.productsQuantity = 0;
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


  emailOrderLimitValidator(): AsyncValidatorFn | null{
    return (control: AbstractControl) : Observable<ValidationErrors | null> => {
      return this.orderService.getOrdersByEmail(control.value).pipe(
        map(data =>{
          return data.length > 3 ? {orderLimit : true} : null
        }),
        catchError(() => {
          alert("error en la api")
          return of({apiCaida : true})
        })
      )
    }
  }


}
