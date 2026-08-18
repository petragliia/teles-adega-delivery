import { useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';

export function useRealtimeOrders(
  onNewOrder: (order: any) => void,
  onUpdateOrder: (order: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel('admin-kanban-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
          if (payload.new) {
            onNewOrder(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
        },
        (payload) => {
          if (payload.new) {
            onUpdateOrder(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewOrder, onUpdateOrder]);
}
