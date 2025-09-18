import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { documentData } from '@/lib/placeholder-data';
import { Download, FileText, FileType, FileUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const fileTypeIcons: { [key: string]: React.ReactNode } = {
  PDF: <FileText className="h-5 w-5 text-red-500" />,
  DOCX: <FileType className="h-5 w-5 text-blue-500" />,
  PPTX: <FileUp className="h-5 w-5 text-orange-500" />,
};

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Access and share educational documents.
        </p>
      </header>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentData.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{doc.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {fileTypeIcons[doc.type]}
                    <span>{doc.type}</span>
                  </div>
                </TableCell>
                <TableCell>{doc.dateAdded}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
