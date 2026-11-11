'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';

// Helper function to create a unique device footprint
const generateDeviceCookie = () => {
  return btoa(navigator.userAgent + screen.width + screen.height + navigator.language);
};

export default function SecureViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const linkId = unwrappedParams.id;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  // Updated the state type to match our database column name
  const [questions, setQuestions] = useState<{ id: string, question_text: string }[]>([]);

  useEffect(() => {
    const initializeViewer = async () => {
      try {
        const currentDeviceCookie = generateDeviceCookie();

        const { data: link, error: linkError } = await supabase
          .from('share_links')
          .select('*, students(name, phone_number)')
          .eq('id', linkId)
          .single();

        if (linkError || !link) {
          throw new Error('This link is invalid or does not exist.');
        }

        if (link.status === 'REVOKED') {
          await logAccess(linkId, 'BLOCKED_REVOKED', currentDeviceCookie);
          throw new Error('Access to this paper has been revoked.');
        }

        if (!link.locked_device_cookie) {
          const { error: updateError } = await supabase
            .from('share_links')
            .update({ locked_device_cookie: currentDeviceCookie })
            .eq('id', linkId);
          if (updateError) throw updateError;
        } else if (link.locked_device_cookie !== currentDeviceCookie) {
          await logAccess(linkId, 'BLOCKED_WRONG_DEVICE', currentDeviceCookie);
          throw new Error('SECURITY VIOLATION: This link is locked to a different device. You cannot forward this link.');
        }

        const { data: questionData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .in('id', link.shuffled_question_ids);

        if (qError) throw qError;

        const orderedQuestions = link.shuffled_question_ids.map((id: string) => 
          questionData.find(q => q.id === id)
        ).filter(Boolean);

        setStudentName(link.students.name);
        setStudentPhone(link.students.phone_number);
        setQuestions(orderedQuestions);
        
        await logAccess(linkId, 'OPENED_SUCCESSFULLY', currentDeviceCookie);
        setLoading(false);

      } catch (err: any) {
        setErrorMsg(err.message);
        setLoading(false);
      }
    };

    initializeViewer();
  }, [linkId]);

  const logAccess = async (shareLinkId: string, action: string, cookie: string) => {
    supabase.from('access_logs').insert([{
      share_link_id: shareLinkId,
      action: action,
      device_browser: navigator.userAgent,
    }]).then();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-bold text-xl text-black">Verifying Security Credentials...</div>;
  }

  if (errorMsg) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
        <div className="bg-white border-4 border-red-500 p-10 rounded shadow-xl text-center max-w-lg">
          <h1 className="text-3xl font-black text-red-600 mb-4">ACCESS DENIED</h1>
          <p className="text-lg font-bold text-gray-800">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Shortened the banner text here */}
      <div className="sticky top-0 bg-red-600 text-white text-center py-2 font-bold z-50 text-sm md:text-base shadow-md">
        CONFIDENTIAL: This paper is securely locked to {studentName} ({studentPhone}).
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col gap-10 select-none">
        {questions.map((q, index) => {
          // Changed q.text to q.question_text to fix the "undefined" bug
          const imageUrl = `/api/render-question?name=${encodeURIComponent(studentName)}&number=${encodeURIComponent(studentPhone)}&q=${encodeURIComponent(q.question_text)}`;
          
          return (
            <div key={q.id} className="relative w-full rounded shadow-2xl overflow-hidden bg-white">
              <div className="absolute top-0 left-0 bg-black text-white px-4 py-2 font-bold text-xl z-20 rounded-br">
                Q {index + 1}
              </div>
              
              <img 
                src={imageUrl} 
                alt={`Question ${index + 1}`}
                className="w-full h-auto pointer-events-none"
                onContextMenu={(e) => e.preventDefault()}
                draggable="false"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}