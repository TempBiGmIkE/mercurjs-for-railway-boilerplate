"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"
import type {
  Stripe,
  StripeCardElement,
  StripeElements,
} from "@stripe/stripe-js"
import Monnify from "monnify-ts"

import { isManual, isMonnify, isStripe } from "@/lib/constants"
import StripeWrapper from "@/components/organisms/PaymentContainer/StripeWrapper"

export type PaymentExecutionContext = {
  cart: HttpTypes.StoreCart
  paymentSession?: HttpTypes.StorePaymentSession
  stripe?: Stripe | null
  elements?: StripeElements | null
  card?: StripeCardElement | null
  onCompleted: () => Promise<void>
  setErrorMessage: (message: string | null) => void
  setSubmitting: (submitting: boolean) => void
}

export interface PaymentProviderAdapter {
  id: string
  canHandle: (providerId?: string) => boolean
  handlePayment: (context: PaymentExecutionContext) => Promise<void>
  renderWrapper?: (props: {
    paymentSession: HttpTypes.StorePaymentSession
    stripeKey?: string
    stripePromise?: Promise<Stripe | null> | null
    children: React.ReactNode
  }) => React.ReactNode
}

const finalizeOrder = async (
  onCompleted: () => Promise<void>,
  setErrorMessage: (message: string | null) => void,
  setSubmitting: (submitting: boolean) => void
) => {
  try {
    await onCompleted()
  } catch (error: any) {
    if (error?.message !== "NEXT_REDIRECT") {
      setErrorMessage(
        error?.message?.replace("Error setting up the request: ", "") ?? null
      )
    }
  } finally {
    setSubmitting(false)
  }
}

const stripeProvider: PaymentProviderAdapter = {
  id: "stripe",
  canHandle: (providerId?: string) => isStripe(providerId) ?? false,
  handlePayment: async ({
    cart,
    paymentSession,
    stripe,
    elements,
    card,
    onCompleted,
    setErrorMessage,
    setSubmitting,
  }) => {
    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    const clientSecret = paymentSession?.data?.client_secret as string | undefined

    if (!clientSecret) {
      setErrorMessage("Stripe client secret is missing.")
      setSubmitting(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      }
    )

    if (error) {
      const pi = error.payment_intent

      if (
        (pi && pi.status === "requires_capture") ||
        (pi && pi.status === "succeeded")
      ) {
        await finalizeOrder(onCompleted, setErrorMessage, setSubmitting)
        return
      }

      setErrorMessage(error.message || null)
      setSubmitting(false)
      return
    }

    if (
      paymentIntent &&
      ((paymentIntent.status === "requires_capture") ||
        paymentIntent.status === "succeeded")
    ) {
      await finalizeOrder(onCompleted, setErrorMessage, setSubmitting)
      return
    }

    setSubmitting(false)
  },
  renderWrapper: ({ paymentSession, stripeKey, stripePromise, children }) => {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise ?? null}
      >
        {children}
      </StripeWrapper>
    )
  },
}

const monnifyProvider: PaymentProviderAdapter = {
  id: "monnify",
  canHandle: (providerId?: string) => isMonnify(providerId) ?? false,
  handlePayment: async ({
    cart,
    paymentSession,
    onCompleted,
    setErrorMessage,
    setSubmitting,
  }) => {
    const apiKey =
      (paymentSession?.data?.api_key ??
        paymentSession?.data?.apiKey ??
        process.env.NEXT_PUBLIC_MONNIFY_API_KEY) as string | undefined

    const contractCode =
      (paymentSession?.data?.contract_code ??
        paymentSession?.data?.contractCode ??
        process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE) as string | undefined

    if (!apiKey || !contractCode) {
      setErrorMessage("Monnify API key or contract code is missing.")
      setSubmitting(false)
      return
    }

    const monnify = new Monnify(apiKey, contractCode)
    const amount = Number((cart.total ?? 0) / 100).toFixed(2)
    const currency = (cart.currency_code || "NGN").toUpperCase()
    const fullName = [
      cart.billing_address?.first_name,
      cart.billing_address?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Customer"

    try {
      monnify.initializePayment({
        amount: Number(amount),
        currency,
        reference: `monnify-${cart.id || Date.now()}-${Date.now()}`,
        customerFullName: fullName,
        customerEmail: cart.email || "customer@example.com",
        paymentDescription: `Checkout for ${cart.id || "cart"}`,
        metadata: {
          cartId: cart.id,
          provider: "monnify",
        },
        redirectUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
        onComplete: async () => {
          await finalizeOrder(onCompleted, setErrorMessage, setSubmitting)
        },
        onClose: () => {
          setSubmitting(false)
          setErrorMessage("Monnify payment was cancelled.")
        },
      })
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to initialize Monnify payment")
      setSubmitting(false)
    }
  },
}

const manualProvider: PaymentProviderAdapter = {
  id: "manual",
  canHandle: (providerId?: string) => isManual(providerId) ?? false,
  handlePayment: async ({
    onCompleted,
    setErrorMessage,
    setSubmitting,
  }) => {
    await finalizeOrder(onCompleted, setErrorMessage, setSubmitting)
  },
}

const paymentProviders: PaymentProviderAdapter[] = [
  stripeProvider,
  monnifyProvider,
  manualProvider,
]

export const getPaymentProvider = (providerId?: string) => {
  return paymentProviders.find((provider) => provider.canHandle(providerId)) ?? null
}
