import React, { useState, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { supabase } from '../lib/supabase';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Fragentext eingeben...',
  className = ''
}) => {
  const [isRichText, setIsRichText] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `question-images/${timestamp}-${file.name}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (file) {
          try {
            const imageUrl = await handleImageUpload(file);
            const imageMarkdown = `![Bild](${imageUrl})`;
            const newValue = value + imageMarkdown;
            onChange(newValue);
          } catch (error) {
            console.error('Error pasting image:', error);
            alert('Fehler beim Einfügen des Bildes');
          }
        }
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await handleImageUpload(file);
        const imageMarkdown = `![Bild](${imageUrl})`;
        const newValue = value + imageMarkdown;
        onChange(newValue);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Fehler beim Hochladen des Bildes');
      }
    }
  };

  const toggleEditor = () => {
    setIsRichText(!isRichText);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toggle Button */}
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Fragentext *
        </label>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleEditor}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              isRichText
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isRichText ? 'Rich Text' : 'Normal'}
          </button>
          {isRichText && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Bild einfügen'}
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Editor */}
      {isRichText ? (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || '')}
            onPaste={handleImagePaste}
            data-color-mode="light"
            height={200}
            preview="edit"
            hideToolbar={false}
            visibleDragBar={false}
            textareaProps={{
              placeholder: placeholder,
              style: {
                fontSize: '14px',
                fontFamily: 'inherit',
              },
            }}
            commands={[
              // Text formatting
              MDEditor.commands.bold,
              MDEditor.commands.italic,
              MDEditor.commands.strikethrough,
              MDEditor.commands.underline,
              MDEditor.commands.code,
              MDEditor.commands.codeBlock,
              MDEditor.commands.quote,
              MDEditor.commands.link,
              MDEditor.commands.image,
              MDEditor.commands.divider,
              // Lists
              MDEditor.commands.unorderedListCommand,
              MDEditor.commands.orderedListCommand,
              MDEditor.commands.checkedListCommand,
              MDEditor.commands.divider,
              // Headers
              MDEditor.commands.title1,
              MDEditor.commands.title2,
              MDEditor.commands.title3,
              MDEditor.commands.title4,
              MDEditor.commands.title5,
              MDEditor.commands.title6,
              MDEditor.commands.divider,
              // Alignment
              MDEditor.commands.textAlign,
              MDEditor.commands.divider,
              // Math
              MDEditor.commands.katex,
              MDEditor.commands.divider,
              // Full screen
              MDEditor.commands.fullscreen,
            ]}
          />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          placeholder={placeholder}
          required
        />
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-1">
        {isRichText 
          ? 'Rich Text Editor: Verwende Markdown für Formatierung. Bilder können per Drag & Drop oder Upload eingefügt werden.'
          : 'Normaler Text: Einfache Texteingabe ohne Formatierung.'
        }
      </p>
    </div>
  );
};

export default RichTextEditor;
