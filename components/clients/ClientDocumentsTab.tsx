'use client';

import { FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function ClientDocumentsTab() {
  return (
    <Card className="p-8 sm:p-12 text-center border-dashed">
      <FolderOpen className="w-10 h-10 mx-auto text-gray-400 mb-3" />
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Documents coming soon</h3>
      <p className="text-[13px] text-gray-600 max-w-md mx-auto">
        Client file storage isn&apos;t set up yet. Transaction documents live on each deal&apos;s Documents tab for now.
      </p>
    </Card>
  );
}
