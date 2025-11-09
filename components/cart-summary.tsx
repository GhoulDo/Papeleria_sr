"use client"

interface CartSummaryProps {
  subtotal: number
  discount: number
  tax: number
  shipping: number
}

export function CartSummary({ subtotal, discount, tax, shipping }: CartSummaryProps) {
  const total = subtotal - discount + tax + shipping

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Descuento</span>
          <span className="text-green-600">-${discount.toFixed(2)}</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Impuestos</span>
        <span>${tax.toFixed(2)}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Envío</span>
        <span>${shipping.toFixed(2)}</span>
      </div>

      <div className="flex justify-between border-t border-border pt-4 font-semibold">
        <span>Total</span>
        <span className="text-lg text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
