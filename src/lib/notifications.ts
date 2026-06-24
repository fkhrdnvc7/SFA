import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

export async function createNotification(params: {
  title: string;
  body: string;
  type?: NotificationType;
  related_table?: string;
  related_id?: string;
  user_id?: string | null;
}) {
  const { error } = await supabase.from('notifications').insert({
    title: params.title,
    body: params.body,
    type: params.type || 'info',
    related_table: params.related_table,
    related_id: params.related_id,
    user_id: params.user_id ?? null,
  });

  if (error) {
    console.error('Xabarnoma yaratishda xatolik:', error);
  }
}
