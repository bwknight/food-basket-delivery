import { Component, OnInit, ViewChild } from '@angular/core';
import { Route } from '@angular/router';

import { AdminGuard } from '../auth/auth-guard';
import { WeeklyFamilies } from '../weekly-families/weekly-families';
import { Context } from '../shared/context';

import { WeeklyFamilyDeliveries, WeeklyFamilyDeliveryStatus, WeeklyFamilyDeliveryProducts } from '../weekly-families-deliveries/weekly-families-deliveries.component';
import { Products } from '../products/products';
import { ItemId } from '../events/ItemId';
import { DialogService } from '../select-popup/dialog';
@Component({
  selector: 'app-my-weekly-families',
  templateUrl: './my-weekly-families.component.html',
  styleUrls: ['./my-weekly-families.component.scss']
})
export class MyWeeklyFamiliesComponent implements OnInit {

  constructor(private context: Context,private dialog:DialogService) {


  }
  @ViewChild('myDiv') myDiv: any;
  async ngOnInit() {
    this.products = await this.context.for(Products).find();
    this.families = await this.context.for(WeeklyFamilies).find({
      //  where: f => f.assignedHelper.isEqualTo(this.context.info.helperId)
    });
  }
  families: WeeklyFamilies[];
  currentFamilly: WeeklyFamilies;
  async selectFamiliy(f: WeeklyFamilies) {
    this.currentFamilly = f;
    this.deliveries = await this.context.for(WeeklyFamilyDeliveries).find({
      where: wfd => wfd.familyId.isEqualTo(f.id),
      orderBy: wfd => [{ column: wfd.ordnial, descending: true }]
    });
  }
  quantity(p: Products, d: WeeklyFamilyDeliveries) {
    const r = this.context.for(WeeklyFamilyDeliveryProducts).lookup(wfdp => wfdp.product.isEqualTo(p.id).and(wfdp.delivery.isEqualTo(d.id)));
    if (r.isNew()) {
      if (!r.requestQuanity.value)
        r.requestQuanity.value = 0;
      r.delivery.value = d.id.value;
      r.product.value = p.id.value;
    }
    return r;
  }
  add(p: Products, d: WeeklyFamilyDeliveries, i: number) {
    let q = this.quantity(p, d);
    var newValue = +(q.requestQuanity.value) + i;
    if (newValue >= 0) {
      q.requestQuanity.value = newValue;
      q.save();
    }
  }
  
  products: Products[];
  static route: Route = {
    path: 'my-weekly-families',
    component: MyWeeklyFamiliesComponent,
    data: { name: 'משפחות שבועיות שלי' }, canActivate: [AdminGuard]
  }
  deliveries: WeeklyFamilyDeliveries[];
  async preparePackage() {
    const f = this.currentFamilly;
    var wfd = this.context.for(WeeklyFamilyDeliveries).create();
    wfd.familyId.value = f.id.value;
    await wfd.save();
    this.deliveries.splice(0, 0, wfd);
  }
  async changeStatus(d: WeeklyFamilyDeliveries, status: WeeklyFamilyDeliveryStatus) {
    d.status.listValue = status;
    await d.save();
  }
  totalItems(d: WeeklyFamilyDeliveries) {
    let x = 0;
    this.products.forEach(p => x += this.quantity(p, d).requestQuanity.value);
    return x;
  }
}
