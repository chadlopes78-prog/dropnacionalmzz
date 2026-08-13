-- Grant usage and select on storage schema
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;

-- Policies for public access to images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access to Images'
    ) THEN
        CREATE POLICY "Public Access to Images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'product-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can upload images'
    ) THEN
        CREATE POLICY "Authenticated users can upload images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'product-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can update their own images'
    ) THEN
        CREATE POLICY "Authenticated users can update their own images"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'product-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated users can delete their own images'
    ) THEN
        CREATE POLICY "Authenticated users can delete their own images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'product-images');
    END IF;
END $$;
