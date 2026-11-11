import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract parameters from the URL
  const studentName = searchParams.get('name') || 'Unknown Student';
  const studentNumber = searchParams.get('number') || '0000000000';
  const questionText = searchParams.get('q') || 'Question text goes here.';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Server-Side Watermark - UPDATED FOR BETTER VISIBILITY */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            right: '-20%',
            bottom: '-20%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '30px', // Tighter spacing so more watermarks fit on screen
            opacity: 0.22, // Slightly darker so it doesn't wash out at angles
            transform: 'rotate(-25deg)',
            fontSize: '36px',
            fontWeight: 'bold', // Makes the watermark text thick and bold
            color: '#000000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Array.from({ length: 50 }).map((_, i) => (
            <span key={i} style={{ display: 'flex' }}>
              {studentName} • {studentNumber}
            </span>
          ))}
        </div>

        {/* Question Text */}
        <div
          style={{
            display: 'flex',
            fontSize: '42px',
            color: '#000000',
            zIndex: 10,
            lineHeight: 1.5,
            fontWeight: '500', // Making the actual question slightly thicker to stand out against the bold watermark
          }}
        >
          {questionText}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}