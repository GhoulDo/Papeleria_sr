import { createClient } from "@/lib/supabase/client"

export async function validateStock(productId: string, quantity: number): Promise<boolean> {
  try {
    const supabase = createClient()

    console.log(`[validateStock] Validando stock para producto ${productId}, cantidad requerida: ${quantity}`)

    const { data, error } = await supabase
      .from("products")
      .select("stock_quantity, name")
      .eq("id", productId)
      .single()

    if (error) {
      console.error(`[validateStock] Error al obtener producto:`, error)
      throw error
    }

    if (!data) {
      console.error(`[validateStock] Producto con ID ${productId} no encontrado`)
      return false
    }

    const availableStock = data.stock_quantity ?? 0
    const productName = data.name || productId
    const hasEnoughStock = availableStock >= quantity

    console.log(`[validateStock] Producto: ${productName}, Stock disponible: ${availableStock}, Cantidad requerida: ${quantity}, Válido: ${hasEnoughStock}`)

    return hasEnoughStock
  } catch (error) {
    console.error(`[validateStock] Error general al validar stock para producto ${productId}:`, error)
    return false
  }
}

export async function updateStock(productId: string, quantity: number, operation: "decrease" | "increase") {
  try {
    const supabase = createClient()

    console.log(`[updateStock] Iniciando actualización de stock para producto ${productId}, operación: ${operation}, cantidad: ${quantity}`)

    // Obtener el stock actual para logging
    const { data: beforeData } = await supabase
      .from("products")
      .select("stock_quantity, name")
      .eq("id", productId)
      .single()

    if (!beforeData) {
      console.error(`[updateStock] Producto con ID ${productId} no encontrado`)
      return false
    }

    const stockBefore = beforeData.stock_quantity ?? 0
    const productName = beforeData.name || productId
    console.log(`[updateStock] Producto: ${productName}, Stock ANTES: ${stockBefore}`)

    // Usar la función SQL con security definer para actualizar el stock
    const { data: functionResult, error: functionError } = await supabase.rpc(
      "update_product_stock",
      {
        p_product_id: productId,
        p_quantity_change: quantity,
        p_operation: operation,
      }
    )

    if (functionError) {
      console.error(`[updateStock] Error al llamar función update_product_stock:`, functionError)
      // Si la función no existe, intentar método directo como fallback
      if (functionError.message?.includes("function") || functionError.code === "42883") {
        console.warn(`[updateStock] La función SQL no existe, usando método directo (puede fallar por RLS)`)
        return await updateStockDirect(supabase, productId, quantity, operation, stockBefore, productName)
      }
      return false
    }

    // Verificar que se actualizó correctamente
    const { data: afterData } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single()

    if (!afterData) {
      console.error(`[updateStock] No se pudo verificar el stock después de la actualización`)
      return false
    }

    const stockAfter = afterData.stock_quantity ?? 0
    const expectedStock = operation === "decrease" ? stockBefore - quantity : stockBefore + quantity

    console.log(`[updateStock] Stock DESPUÉS: ${stockAfter}, Esperado: ${expectedStock}`)

    if (stockAfter !== expectedStock) {
      console.error(`[updateStock] ADVERTENCIA: El stock actualizado (${stockAfter}) no coincide con el esperado (${expectedStock})`)
      return false
    }

    console.log(`[updateStock] ✅ Stock actualizado correctamente: ${stockBefore} → ${stockAfter}`)
    return true
  } catch (error) {
    console.error(`[updateStock] Error general al actualizar stock para producto ${productId}:`, error)
    return false
  }
}

// Función de fallback si la función SQL no existe
async function updateStockDirect(
  supabase: any,
  productId: string,
  quantity: number,
  operation: "decrease" | "increase",
  currentStock: number,
  productName: string
): Promise<boolean> {
  try {
    let newQuantity: number

    if (operation === "decrease") {
      newQuantity = currentStock - quantity
      if (newQuantity < 0) {
        console.error(`[updateStock] Stock insuficiente para ${productName}. Stock actual: ${currentStock}, intentando reducir: ${quantity}`)
        return false
      }
    } else {
      newQuantity = currentStock + quantity
    }

    const { error: updateError, data: updateData } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", productId)
      .select("stock_quantity")

    if (updateError) {
      console.error(`[updateStock] Error al actualizar stock directamente:`, updateError)
      return false
    }

    return updateData && updateData.length > 0 && updateData[0].stock_quantity === newQuantity
  } catch (error) {
    console.error(`[updateStock] Error en método directo:`, error)
    return false
  }
}
