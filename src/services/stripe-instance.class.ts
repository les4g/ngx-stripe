import { Inject, PLATFORM_ID } from '@angular/core';

import { WindowRef } from './window-ref.service';
import { LazyStripeAPILoader, Status } from './api-loader.service';

import {
  STRIPE_PUBLISHABLE_KEY,
  StripeJS,
  STRIPE_OPTIONS,
  Options
} from '../interfaces/stripe';
import { Element } from '../interfaces/element';
import { Elements, ElementsOptions } from '../interfaces/elements';
import {
  SourceData,
  SourceResult,
  isSourceData,
  SourceParams
} from '../interfaces/sources';
import {
  CardDataOptions,
  TokenResult,
  BankAccount,
  BankAccountData,
  PiiData,
  Pii,
  isBankAccount,
  isBankAccountData,
  isPii,
  isPiiData
} from '../interfaces/token';
import { StripeServiceInterface } from './stripe-instance.interface';
import { PaymentRequestOptions } from '../interfaces/payment-request';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, filter, catchError, mergeMap, first, switchMap } from 'rxjs/operators';

export class StripeInstance implements StripeServiceInterface {
  private stripe$: BehaviorSubject<StripeJS | undefined> = new BehaviorSubject<
    StripeJS | undefined
    >(undefined);

  /**
   *
   */

  constructor(
    private loader: LazyStripeAPILoader,
    private window: WindowRef,
    private key: string,
    private options?: Options
  ) {
    this.loader
      .asStream()
      .pipe(filter((status: Status) => status.loaded === true))
      .pipe(first())
      .pipe(map(() => (this.window.getNativeWindow() as any).Stripe))
      .subscribe((Stripe: any) => {
        const stripe = this.options
          ? (Stripe(this.key, this.options) as StripeJS)
          : (Stripe(this.key) as StripeJS);

        this.stripe$.next(stripe);
      });
  }

  public getInstance(): StripeJS | undefined {
    return this.stripe$.getValue();
  }

  public elements(options?: ElementsOptions): Observable<Elements> {
    return this.stripe$
      .asObservable()
      .pipe(filter(stripe => Boolean(stripe)))
      .pipe(map(stripe => (stripe as StripeJS).elements(options)))
      .pipe(first());
  }

  public createToken(
    a: Element | BankAccount | Pii,
    b: CardDataOptions | BankAccountData | PiiData | undefined
  ): Observable<TokenResult> {
    return this.stripe$
      .asObservable()
      .pipe(filter(stripe => Boolean(stripe)))
      .pipe(switchMap(s => {
        const stripe = s as StripeJS;

        if (isBankAccount(a) && isBankAccountData(b)) {
          return from(stripe.createToken(a, b));
        } else if (isPii(a) && isPiiData(b)) {
          return from(stripe.createToken(a, b));
        } else {
          return from(
            stripe.createToken(a as Element, b as CardDataOptions | undefined)
          );
        }
      }))
      .pipe(first());
  }

  public createSource(
    a: Element | SourceData,
    b?: SourceData | undefined
  ): Observable<SourceResult> {
    return this.stripe$
      .asObservable()
      .pipe(filter(stripe => Boolean(stripe)))
      .pipe(switchMap(s => {
        const stripe = s as StripeJS;

        if (isSourceData(a)) {
          return from(stripe.createSource(a as SourceData));
        }
        return from(stripe.createSource(a as Element, b));
      }))
      .pipe(first());
  }

  public retrieveSource(source: SourceParams): Observable<SourceResult> {
    return this.stripe$
      .asObservable()
      .pipe(filter(stripe => Boolean(stripe)))
      .pipe(switchMap(s => {
        const stripe = s as StripeJS;

        return from(stripe.retrieveSource(source));
      }))
      .pipe(first());
  }

  public paymentRequest(options: PaymentRequestOptions) {
    const stripe = this.getInstance();
    if (stripe) {
      return stripe.paymentRequest(options);
    }
    return undefined;
  }
}
