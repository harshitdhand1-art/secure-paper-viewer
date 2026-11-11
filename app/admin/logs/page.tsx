'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      // Fetch the latest 100 logs and join them with the student and paper details
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          id,
          action,
          device_browser,
          created_at,
          share_links (
            students ( name, phone_number ),
            papers ( title )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-10 max-w-6xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-bold mb-6">Admin: Security Access Logs</h1>
      
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-4 font-bold text-sm">Timestamp</th>
              <th className="p-4 font-bold text-sm">Student</th>
              <th className="p-4 font-bold text-sm">Paper</th>
              <th className="p-4 font-bold text-sm">Action / Status</th>
              <th className="p-4 font-bold text-sm">Device Info</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center font-bold">Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center font-bold text-gray-500">No access logs found yet.</td></tr>
            ) : (
              logs.map((log) => {
                // Determine the color based on the action
                const isBlocked = log.action.includes('BLOCKED');
                const statusColor = isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

                return (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold">
                      {log.share_links?.students?.name} <br/>
                      <span className="text-sm font-normal text-gray-500">{log.share_links?.students?.phone_number}</span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-700">
                      {log.share_links?.papers?.title}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-500 max-w-xs truncate" title={log.device_browser}>
                      {log.device_browser}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}