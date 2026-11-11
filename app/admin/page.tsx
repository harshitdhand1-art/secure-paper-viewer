'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [paperTitle, setPaperTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const handleProcessAndSave = async () => {
    if (!paperTitle || !rawText) {
      setSaveStatus('Please provide a title and paste the paper.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('Processing...');

    // Split the text into individual questions based on double line breaks
    const blocks = rawText.split('\n\n').filter(b => b.trim() !== '');
    
    try {
      // 1. Save the Master Paper to Supabase
      const { data: paperData, error: paperError } = await supabase
        .from('papers')
        .insert([{ title: paperTitle, total_questions: blocks.length }])
        .select()
        .single();

      if (paperError) throw paperError;

      // 2. Prepare the questions for insertion
      const questionsToInsert = blocks.map((block, index) => ({
        paper_id: paperData.id,
        original_order: index + 1,
        question_text: block.trim()
      }));

      // 3. Save the Questions to Supabase
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      setSaveStatus(`Success! Saved paper "${paperTitle}" with ${blocks.length} questions.`);
      setRawText('');
      setPaperTitle('');
      
    } catch (error: any) {
      setSaveStatus(`Error saving to database: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto font-sans text-black">
      <h1 className="text-3xl font-bold mb-6">Admin: Upload Pediatrics Paper</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <label className="block text-sm font-bold mb-2">Paper Title</label>
        <input 
          type="text"
          placeholder="e.g., Pediatrics Midterm 2026"
          className="w-full p-3 mb-6 border rounded"
          value={paperTitle}
          onChange={(e) => setPaperTitle(e.target.value)}
        />

        <label className="block text-sm font-bold mb-2">Question Paper Content</label>
        <p className="mb-2 text-xs text-gray-500">
          Paste your questions below. Leave a blank line (press Enter twice) between each question.
        </p>
        <textarea 
          className="w-full h-64 p-4 border rounded"
          placeholder="Question 1 text goes here...&#10;&#10;Question 2 text goes here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        
        <button 
          onClick={handleProcessAndSave}
          disabled={isSaving}
          className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-400 w-full"
        >
          {isSaving ? 'Saving to Database...' : 'Process & Save Paper'}
        </button>

        {saveStatus && (
          <div className={`mt-4 p-4 rounded font-semibold ${saveStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
}