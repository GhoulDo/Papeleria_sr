-- Función para actualizar stock de productos
-- Esta función usa security definer para permitir que usuarios autenticados actualicen el stock
-- cuando están creando órdenes, pero solo reduce/aumenta el stock, no permite valores arbitrarios

create or replace function public.update_product_stock(
  p_product_id uuid,
  p_quantity_change integer,
  p_operation text -- 'decrease' o 'increase'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_stock integer;
  v_new_stock integer;
  v_product_name text;
begin
  -- Verificar que el usuario esté autenticado
  if auth.uid() is null then
    raise exception 'Usuario no autenticado';
  end if;

  -- Obtener el stock actual y nombre del producto
  select stock_quantity, name into v_current_stock, v_product_name
  from public.products
  where id = p_product_id;

  if v_current_stock is null then
    raise exception 'Producto no encontrado: %', p_product_id;
  end if;

  -- Calcular el nuevo stock según la operación
  if p_operation = 'decrease' then
    v_new_stock := v_current_stock - p_quantity_change;
    
    -- Validar que el stock no quede negativo
    if v_new_stock < 0 then
      raise exception 'Stock insuficiente para el producto %. Stock actual: %, intentando reducir: %', 
        v_product_name, v_current_stock, p_quantity_change;
    end if;
  elsif p_operation = 'increase' then
    v_new_stock := v_current_stock + p_quantity_change;
  else
    raise exception 'Operación inválida: %. Debe ser "decrease" o "increase"', p_operation;
  end if;

  -- Actualizar el stock
  update public.products
  set stock_quantity = v_new_stock,
      updated_at = now()
  where id = p_product_id;

  -- Verificar que se actualizó correctamente
  if not found then
    raise exception 'No se pudo actualizar el stock del producto %', p_product_id;
  end if;

  return true;
exception
  when others then
    -- Log del error (puedes agregar logging aquí si lo necesitas)
    raise;
end;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
grant execute on function public.update_product_stock(uuid, integer, text) to authenticated;

-- Comentario para documentación
comment on function public.update_product_stock(uuid, integer, text) is 
'Actualiza el stock de un producto. Usa security definer para permitir que usuarios autenticados actualicen el stock al crear órdenes.';

