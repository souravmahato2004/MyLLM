import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHistory } from '../services/historyService';
import type { ToolInteraction } from '../types';

export function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<ToolInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then((items) => {
        setHistoryItems(items);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto fade-up p-4 md:p-12">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center">
          <History className="w-4 h-4" />
        </span>
        <h1 className="text-xl font-bold text-stone-800">History</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-stone-400">Loading history...</div>
      ) : historyItems.length > 0 ? (
        <div className="space-y-4">
          {/* History items listing placeholder */}
        </div>
      ) : (
        /* Empty state card */
        <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <History className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-base font-semibold text-stone-600 mb-1">
             No interactions yet
          </p>
          <p className="text-sm text-stone-400 max-w-xs">
            Your past tool interactions will appear here once you start using the editor.
          </p>
        </div>
      )}
    </div>
  );
}
