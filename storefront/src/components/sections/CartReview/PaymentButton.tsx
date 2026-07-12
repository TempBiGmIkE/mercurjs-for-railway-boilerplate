"use client"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { Button } from "@/components/atoms"
import { placeOrder } from "@/lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useEffect, useMemo, useState } from "react"
import { getPaymentProvider } from "@/lib/payment/registry"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s: HttpTypes.StorePaymentSession) => s.status === "pending"
  )
  const provider = getPaymentProvider(paymentSession?.provider_id)

  if (!provider) {
    return (
      <Button disabled className="w-full">
        Select a payment method
      </Button>
    )
  }

  return (
    <PaymentActionButton
      provider={provider}
      cart={cart}
      notReady={notReady}
      paymentSession={paymentSession}
      data-testid={dataTestId}
    />
  )
}

type PaymentActionButtonProps = {
  provider: ReturnType<typeof getPaymentProvider>
  cart: HttpTypes.StoreCart
  notReady: boolean
  paymentSession?: HttpTypes.StorePaymentSession
  "data-testid"?: string
}

const PaymentActionButton = ({
  provider,
  cart,
  notReady,
  paymentSession,
  "data-testid": dataTestId,
}: PaymentActionButtonProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(true)

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder()
      if (!res.ok) {
        setErrorMessage(res.error?.message)
      }
    } catch (error: any) {
      if (error?.message !== "NEXT_REDIRECT") {
        setErrorMessage(
          error?.message?.replace("Error setting up the request: ", "")
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const isStripeProvider = provider?.id === "stripe"

  useEffect(() => {
    if (isStripeProvider) {
      // @ts-ignore
      setDisabled(!card?._complete)
    }
  }, [card, stripe, elements, cart, isStripeProvider])

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    if (provider?.id === "stripe") {
      await provider.handlePayment({
        cart,
        paymentSession,
        stripe,
        elements,
        card,
        onCompleted: onPaymentCompleted,
        setErrorMessage,
        setSubmitting,
      })
      return
    }

    await provider?.handlePayment({
      cart,
      paymentSession,
      onCompleted: onPaymentCompleted,
      setErrorMessage,
      setSubmitting,
    })
  }

  const buttonLabel = useMemo(() => {
    if (provider?.id === "stripe") {
      return "Place order"
    }

    return "Place order"
  }, [provider?.id])

  return (
    <>
      <Button
        disabled={provider?.id === "stripe" ? disabled || notReady : notReady}
        onClick={handlePayment}
        loading={submitting}
        className="w-full"
      >
        {buttonLabel}
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid={
          provider?.id === "stripe" ? "stripe-payment-error-message" : "manual-payment-error-message"
        }
      />
    </>
  )
}

export default PaymentButton
