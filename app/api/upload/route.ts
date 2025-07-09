import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No files provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uploadResults = await Promise.all(
      files.map(async (file, index) => {
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const uploadDir = path.join(process.cwd(), 'public', 'upload');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const tempPath = path.join(uploadDir, `temp-${index}-${file.name}`);

        await fs.promises.writeFile(tempPath, fileBuffer);

        const result = await cloudinary.uploader.upload(tempPath, {
          resource_type: 'auto',
        });

        await fs.promises.unlink(tempPath);

        return {
          url: result.secure_url,
          public_id: result.public_id,
        };
      })
    );

    return new Response(
      JSON.stringify({ success: true, result: uploadResults }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const public_id = body.public_id as string;

    if (!public_id) {
      return new Response(
        JSON.stringify({ success: false, message: 'Public ID is required for deletion.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Delete error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
