import { decode } from 'base64-arraybuffer';
import 'react-native-url-polyfill/auto';
import { supabase } from './superbase';

export async function uploadProfileImage(base64: string, userId: string) {
  const filePath = `avatars/${userId}_${Date.now()}.png`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, decode(base64), {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}