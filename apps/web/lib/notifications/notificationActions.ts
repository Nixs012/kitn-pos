import { createClient } from '@/lib/supabase/client';
import { NotificationType } from '@/stores/notificationStore';

const supabase = createClient();

export async function createNotification({
  tenantId,
  userId,
  type,
  title,
  message
}: {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
}) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        type,
        title,
        message,
        is_read: false
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function checkStockAndNotify(
  productId: string, 
  productName: string,
  newQuantity: number, 
  reorderLevel: number,
  tenantId: string
) {
  if (newQuantity <= 0) {
    await createNotification({
      tenantId,
      type: 'out_of_stock',
      title: 'Out of Stock',
      message: `${productName} is OUT OF STOCK`
    });
  } else if (newQuantity <= reorderLevel) {
    await createNotification({
      tenantId,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productName} is running low — only ${newQuantity} units left`
    });
  }
}
