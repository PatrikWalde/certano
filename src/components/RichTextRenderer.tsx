import React from 'react';
import MDEditor from '@uiw/react-md-editor';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = ''
}) => {
  // Check if content contains markdown or HTML
  const isMarkdown = content.includes('**') || 
                    content.includes('*') || 
                    content.includes('#') || 
                    content.includes('![') || 
                    content.includes('[') ||
                    content.includes('```') ||
                    content.includes('>');

  if (isMarkdown) {
    return (
      <div className={`rich-text-renderer ${className}`}>
        <MDEditor.Markdown 
          source={content} 
          data-color-mode="light"
          style={{
            backgroundColor: 'transparent',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
          }}
        />
      </div>
    );
  }

  // Fallback to plain text
  return (
    <div className={`rich-text-renderer ${className}`}>
      {content}
    </div>
  );
};

export default RichTextRenderer;
