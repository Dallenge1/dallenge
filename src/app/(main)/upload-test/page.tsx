
'use client';

import { useState, ChangeEvent } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud } from 'lucide-react';

export default function UploadTestPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const addLog = (log: string) => {
    console.log(log);
    setLogs((prev) => [...prev, log]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a file and ensure you are logged in.',
      });
      return;
    }

    setIsLoading(true);
    setLogs([]);
    setDownloadUrl(null);
    addLog('Upload process started...');

    try {
      // 1. Create a storage reference
      const filePath = `upload-test/${user.uid}/${Date.now()}-${file.name}`;
      addLog(`1. Created file path: ${filePath}`);
      const storageRef = ref(storage, filePath);
      addLog(`2. Created storage reference.`);

      // 2. Upload the file
      addLog(`3. Attempting to upload file: "${file.name}"...`);
      const uploadTask = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      addLog('4. File uploaded successfully!');
      console.log('Upload task snapshot:', uploadTask);


      // 3. Get the download URL
      addLog('5. Attempting to get download URL...');
      const url = await getDownloadURL(uploadTask.ref);
      setDownloadUrl(url);
      addLog(`6. Success! Download URL: ${url}`);

      toast({
        title: 'Upload Successful!',
        description: 'The file was uploaded to Firebase Storage.',
      });

    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      console.error('Upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unknown error occurred. Check the console.',
      });
    } finally {
      setIsLoading(false);
      addLog('Upload process finished.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Upload Test</h1>
        <p className="text-muted-foreground">
          A simple page to test file uploads to Firebase Storage.
        </p>
      </header>

      <div className="max-w-2xl mx-auto grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Uploader</CardTitle>
            <CardDescription>
              Select a file and click "Upload" to test the storage connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" onChange={handleFileChange} disabled={isLoading} />
            <Button
              onClick={handleUpload}
              disabled={isLoading || !file}
              className="w-full"
            >
              {isLoading ? 'Uploading...' : <><UploadCloud className="mr-2" /> Upload to Firebase</>}
            </Button>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
              <CardDescription>
                Follow the upload process step-by-step. Check the developer console for more details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs p-4 bg-muted rounded-md overflow-x-auto">
                <code>{logs.join('\n')}</code>
              </pre>
              {downloadUrl && (
                 <Alert className="mt-4">
                    <AlertTitle>Upload Complete</AlertTitle>
                    <AlertDescription className="break-all">
                        <p>File available at:</p>
                        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            {downloadUrl}
                        </a>
                    </AlertDescription>
                 </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
