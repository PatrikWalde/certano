import React from 'react';

interface HtmlRendererProps {
  content: string;
  className?: string;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({
  content,
  className = ''
}) => {
  // Check if content is HTML
  const isHtml = content.includes('<') && content.includes('>');

  if (isHtml) {
    // Filter out Froala Editor attribution
    const filteredContent = content
      .replace(/<p[^>]*data-f-id="pbf"[^>]*>.*?Powered by.*?<\/p>/gi, '')
      .replace(/<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>.*?Powered by.*?<\/p>/gi, '');
    
    return (
      <div 
        className={`html-renderer ${className}`}
        dangerouslySetInnerHTML={{ __html: filteredContent }}
        style={{
          lineHeight: '1.6',
          fontSize: 'inherit',
          fontFamily: 'inherit'
        }}
      />
    );
  }

  // Fallback to plain text
  return (
    <div className={`html-renderer ${className}`}>
      {content}
    </div>
  );
};

export default HtmlRenderer;
