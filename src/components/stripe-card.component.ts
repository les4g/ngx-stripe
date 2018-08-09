import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  EventEmitter,
  Output
} from '@angular/core';

import {
  Element as StripeElement,
  ElementOptions,
  ElementEventType
} from '../interfaces/element';
import { StripeService } from '../services/stripe.service';
import { Elements, ElementsOptions } from '../interfaces/elements';
import { StripeInstance } from '../services/stripe-instance.class';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@Component({
  selector: 'ngx-stripe-card',
  template: `<div class="field" #stripeCard></div>`
})
export class StripeCardComponent implements OnInit {
  @Output() public card = new EventEmitter<StripeElement>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output()
  public on = new EventEmitter<{ type: ElementEventType; event: any }>();

  @ViewChild('stripeCard') private stripeCard: ElementRef | any;
  private element: StripeElement | any;
  @Input()
  private set options(optionsIn: ElementOptions) {
    this.options$.next(optionsIn);
  }
  private options$ = new BehaviorSubject<ElementOptions>({});
  @Input()
  private set elementsOptions(optionsIn: ElementsOptions) {
    this.elementsOptions$.next(optionsIn);
  }
  private elementsOptions$ = new BehaviorSubject<ElementsOptions>({});
  @Input()
  private set stripe(stripeIn: StripeInstance) {
    this.stripe$.next(stripeIn);
  }
  private stripe$ = new BehaviorSubject<StripeInstance | null>(null);

  constructor(private stripeService: StripeService) { }

  public ngOnInit() {
    const elements$: Observable<Elements> = combineLatest(
      this.elementsOptions$.asObservable(),
      this.stripe$.asObservable()
    ).pipe(switchMap(([options, stripe]) => {
      if (stripe) {
        if (Object.keys(options).length > 0) {
          return stripe.elements(options);
        }
        return stripe.elements();
      } else {
        if (Object.keys(options).length > 0) {
          return this.stripeService.elements(options);
        }
        return this.stripeService.elements();
      }
    }));
    combineLatest(
      elements$,
      this.options$.asObservable().pipe(filter(options => Boolean(options)))
    ).subscribe(([elements, options]) => {
      this.element = elements.create('card', options);

      this.element.on('blur', ev =>
        this.on.emit({
          event: ev,
          type: 'blur'
        })
      );

      this.element.on('change', ev =>
        this.on.emit({
          event: ev,
          type: 'change'
        })
      );

      this.element.on('click', ev =>
        this.on.emit({
          event: ev,
          type: 'click'
        })
      );

      this.element.on('focus', ev =>
        this.on.emit({
          event: ev,
          type: 'focus'
        })
      );

      this.element.on('ready', ev =>
        this.on.emit({
          event: ev,
          type: 'ready'
        })
      );

      this.element.mount(this.stripeCard.nativeElement);

      this.card.emit(this.element);
    });
  }

  public getCard(): StripeElement {
    return this.element;
  }
}
