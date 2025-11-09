import { createClient } from "@/lib/supabase/client"

export async function validateStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("products").select("stock_quantity").eq("id", productId).single()

    if (error) throw error

    return data?.stock_quantity >= quantity
  } catch (error) {
    console.error("Error validating stock:", error)
    return false
  }
}

export async function updateStock(productId: string, quantity: number, operation: "decrease" | "increase") {
  try {
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (fetchError) throw fetchError

    const newQuantity = operation === "decrease" ? data.stock_quantity - quantity : data.stock_quantity + quantity

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", productId)

    if (updateError) throw updateError

    return true
  } catch (error) {
    console.error("Error updating stock:", error)
    return false
  }
}
