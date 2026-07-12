"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import { HttpTypes } from "@medusajs/types"
import { getPaymentProvider } from "@/lib/payment/registry"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s: HttpTypes.StorePaymentSession) => s.status === "pending"
  )

  const provider = getPaymentProvider(paymentSession?.provider_id)

  if (provider?.renderWrapper && paymentSession) {
    return (
      <>
        {provider.renderWrapper({
          paymentSession,
          stripeKey,
          stripePromise,
          children,
        })}
      </>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
