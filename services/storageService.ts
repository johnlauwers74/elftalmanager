
import { supabase } from '../lib/supabase';

export type BucketName = 'oefeningen' | 'artikelen' | 'podcasts';

/**
 * SQL VOOR SUPABASE SQL EDITOR OM RLS OP TE LOSSEN:
 * 
 * -- 1. Maak buckets publiek toegankelijk (lezen)
 * insert into storage.buckets (id, name, public) 
 * values ('oefeningen', 'oefeningen', true), ('artikelen', 'artikelen', true), ('podcasts', 'podcasts', true)
 * on conflict (id) do update set public = true;
 * 
 * -- 2. Toestaan dat iedereen (of geauthenticeerde gebruikers) kan uploaden
 * create policy "Upload Toestaan" on storage.objects for insert with check ( bucket_id in ('oefeningen', 'artikelen', 'podcasts') );
 * 
 * -- 3. Toestaan dat iedereen kan kijken naar de afbeeldingen
 * create policy "Bekijken Toestaan" on storage.objects for select using ( bucket_id in ('oefeningen', 'artikelen', 'podcasts') );
 */

export const uploadFile = async (bucket: BucketName, file: File): Promise<string | null> => {
  try {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      if (error.message.includes('row-level security') || (error as any).status === 403) {
        throw new Error(`STORAGE_RLS_ERROR: Geen toestemming voor '${bucket}'. Voeg de juiste Policies toe in je Supabase Dashboard onder Storage > Policies.`);
      }
      if (error.message.includes('bucket not found') || (error as any).status === 404) {
        throw new Error(`STORAGE_BUCKET_NOT_FOUND: De bucket '${bucket}' bestaat nog niet.`);
      }
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error: any) {
    console.error(`❌ Storage Fout:`, error);
    
    // We gooien de error door zodat het component het kan afhandelen
    throw error;
  }
};
