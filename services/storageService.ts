
import { supabase } from '../lib/supabase';

export type BucketName = 'oefeningen' | 'artikelen' | 'podcasts';

export const uploadFile = async (bucket: BucketName, file: File): Promise<string | null> => {
  try {
    // Genereer een unieke bestandsnaam om overschrijven te voorkomen
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Haal de publieke URL op
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error(`Fout bij uploaden naar ${bucket}:`, error);
    alert(`Upload mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    return null;
  }
};
