'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Added linkId to store the raw database UUID for deletion
type StudentRow = {
  id: number;
  name: string;
  phone: string;
  link: string;
  linkId?: string; 
  loading: boolean;
  error: string;
};

export default function GenerateLinksPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState('');
  
  const [rows, setRows] = useState<StudentRow[]>([
    { id: Date.now(), name: '', phone: '', link: '', loading: false, error: '' }
  ]);

  useEffect(() => {
    const fetchPapers = async () => {
      const { data } = await supabase
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setPapers(data);
    };
    fetchPapers();
  }, []);

  const updateRow = (id: number, newValues: Partial<StudentRow>) => {
    setRows(prevRows => 
      prevRows.map(row => row.id === id ? { ...row, ...newValues } : row)
    );
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), name: '', phone: '', link: '', loading: false, error: '' }]);
  };

  // NEW: Function to permanently delete the link from the database and UI
  const handleDeleteRow = async (rowId: number) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    // If a live link was already generated, delete it from Supabase
    if (row.linkId) {
      const isConfirmed = window.confirm(`Are you sure you want to permanently delete the link for ${row.name}?`);
      if (!isConfirmed) return;

      updateRow(rowId, { loading: true });
      
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', row.linkId);
      
      if (error) {
        updateRow(rowId, { error: 'Failed to delete link', loading: false });
        return;
      }
    }

    // Remove the row from the screen (if it's the last row, just reset it to blank)
    if (rows.length === 1) {
      setRows([{ id: Date.now(), name: '', phone: '', link: '', loading: false, error: '' }]);
    } else {
      setRows(prevRows => prevRows.filter(r => r.id !== rowId));
    }
  };

  const handleGenerate = async (rowId: number) => {
    if (!selectedPaper) {
      alert("Please select a question paper at the top first!");
      return;
    }

    const row = rows.find(r => r.id === rowId);
    if (!row || !row.name || !row.phone) {
      updateRow(rowId, { error: 'Name and Phone required' });
      return;
    }

    updateRow(rowId, { loading: true, error: '', link: '' });

    try {
      let { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('phone_number', row.phone)
        .single();
      
      if (!student) {
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert([{ name: row.name, phone_number: row.phone }])
          .select()
          .single();
          
        if (studentError) throw studentError;
        student = newStudent;
      }

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('paper_id', selectedPaper);
        
      if (qError) throw qError;

      const shuffledIds = questions.map(q => q.id).sort(() => Math.random() - 0.5);

      const { data: link, error: linkError } = await supabase
        .from('share_links')
        .insert([{
          student_id: student.id,
          paper_id: selectedPaper,
          shuffled_question_ids: shuffledIds
        }])
        .select()
        .single();

      if (linkError) {
         if (linkError.code === '23505') {
             throw new Error('Link already exists for this student.');
         }
         throw linkError;
      }

      const fullUrl = `${window.location.origin}/view/${link.id}`;
      // Updated to store the raw link.id so we can delete it later
      updateRow(rowId, { link: fullUrl, linkId: link.id, loading: false });
      
    } catch (error: any) {
      updateRow(rowId, { error: error.message, loading: false });
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-bold mb-6">Admin: Batch Generate Links</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
        <label className="block text-sm font-bold mb-2">1. Select Question Paper</label>
        <select 
          className="w-full p-3 border rounded bg-gray-50 font-semibold"
          value={selectedPaper}
          onChange={(e) => setSelectedPaper(e.target.value)}
        >
          <option value="">-- Choose a saved paper --</option>
          {papers.map(p => (
            <option key={p.id} value={p.id}>{p.title} ({p.total_questions} questions)</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-4 font-bold text-sm">Student Name</th>
              <th className="p-4 font-bold text-sm">Phone Number</th>
              <th className="p-4 font-bold text-sm">Unique Link</th>
              <th className="p-4 font-bold text-sm w-40">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input 
                    type="text" 
                    placeholder="Rahul Sharma"
                    className="w-full p-2 border rounded"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    disabled={!!row.link}
                  />
                </td>
                <td className="p-4">
                  <input 
                    type="text" 
                    placeholder="9876543210"
                    className="w-full p-2 border rounded"
                    value={row.phone}
                    onChange={(e) => updateRow(row.id, { phone: e.target.value })}
                    disabled={!!row.link}
                  />
                </td>
                <td className="p-4">
                  {row.link ? (
                    <input 
                      type="text" 
                      readOnly 
                      value={row.link} 
                      className="w-full p-2 bg-green-50 text-green-900 border border-green-200 rounded font-mono text-sm font-bold select-all cursor-pointer"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      title="Click to select all"
                    />
                  ) : (
                    <span className="text-sm text-red-500 font-semibold">{row.error}</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {!row.link ? (
                      <>
                        <button 
                          onClick={() => handleGenerate(row.id)}
                          disabled={row.loading}
                          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-400 w-full"
                        >
                          {row.loading ? '...' : 'Generate'}
                        </button>
                        <button 
                          onClick={() => handleDeleteRow(row.id)}
                          disabled={row.loading}
                          className="px-3 py-2 bg-red-100 text-red-600 font-bold rounded hover:bg-red-200"
                          title="Remove Empty Row"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        disabled={row.loading}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:bg-gray-400 w-full"
                      >
                        {row.loading ? '...' : 'Delete Link'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 bg-gray-50 border-t">
          <button 
            onClick={addRow}
            className="px-4 py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-900"
          >
            + Add Another Row
          </button>
        </div>
      </div>
    </div>
  );
}