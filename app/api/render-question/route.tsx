import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const studentName = searchParams.get('name') || 'Unknown Student';
  const studentNumber = searchParams.get('number') || '0000000000';
  const questionText = searchParams.get('q') || 'Question text goes here.';

  // Smart Font Sizing: If it's a very long question, shrink the text so it fits
  const isLongQuestion = questionText.length > 250;
  const dynamicFontSize = isLongQuestion ? '26px' : '36px';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          padding: '80px', // Slightly larger padding so text doesn't hit the absolute edge
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Server-Side Watermark */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            right: '-20%',
            bottom: '-20%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '30px',
            opacity: 0.22, 
            transform: 'rotate(-25deg)',
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#000000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} style={{ display: 'flex' }}>
              {studentName} • {studentNumber}
            </span>
          ))}
        </div>

        {/* Question Text */}
        <div
          style={{
            display: 'flex',
            fontSize: dynamicFontSize,
            color: '#000000',
            zIndex: 10,
            lineHeight: 1.6,
            fontWeight: '500',
            whiteSpace: 'pre-wrap', // Ensures line-breaks within the question render correctly
          }}
        >
          {questionText}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800, // Made the canvas taller to accommodate long pediatrics cases
    }
  );
}