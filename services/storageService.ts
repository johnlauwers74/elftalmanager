
import { supabase } from '../lib/supabase';

export type BucketName = 'oefeningen' | 'artikelen' | 'podcasts';

export const uploadFile = async (bucket: BucketName, file: File): Promise<string | null> => {
  try {
    // 1. Controleer of het bestand geldig is
    if (!file) return null;

    // 2. Genereer een unieke bestandsnaam
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log(`📤 Uploaden naar bucket '${bucket}': ${filePath}`);

    // 3. Voer de upload uit
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // Specifieke hulp bij veelvoorkomende bucket-fouten
      if (error.message.includes('bucket not found') || (error as any).status === 404) {
        throw new Error(`De bucket '${bucket}' bestaat nog niet in Supabase. Maak deze aan onder 'Storage' in je dashboard.`);
      }
      if (error.message.includes('row-level security') || (error as any).status === 403) {
        throw new Error(`Geen toestemming om te uploaden naar '${bucket}'. Controleer de RLS-policies in Supabase Storage.`);
      }
      throw error;
    }

    // 4. Haal de publieke URL op
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`✅ Upload geslaagd! URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Fout bij uploaden naar ${bucket}:`, error);
    alert(`Upload mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    return null;
  }
};
