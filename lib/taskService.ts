import { supabase } from '../lib/superbase';
export interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'Work in progress' | 'Completed';
  user_id?: string;
  created_at?: string;
}

export async function fetchTasks() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { data: null, error: { message: 'Not logged in' } };

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function addTask(title: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { data: null, error: { message: 'Not logged in' } };

  const { data: existing, count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((existing?.length || 0) >= 20) {
    return { data: null, error: { message: 'Task limit (20) reached.' } };
  }

  const { data, error } = await supabase.from('tasks').insert({
    title,
    status: 'Pending',
    user_id: user.id,
  });

  return { data, error };
}

export async function updateTask(id: string, status: string) {
  return await supabase.from('tasks').update({ status }).eq('id', id);
}

export async function deleteCompletedTasks() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { error: { message: 'Not logged in' } };

  return await supabase
    .from('tasks')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'Completed');
}
