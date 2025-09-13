import React, { useState, useRef } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `question-images/${timestamp}-${file.name}`;
      
      // Upload to Supabase Storage
      const { error } = await supabase.storage
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await handleImageUpload(file);
        insertImage(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Fehler beim Hochladen des Bildes');
      }
    }
  };

  const insertImage = (imageUrl: string) => {
    if (editorRef.current) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = 'Bild';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.margin = '10px 0';
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorRef.current.appendChild(img);
      }
      
      updateValue();
    }
  };

  const updateValue = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Don't update state during typing to prevent cursor jumping
    // The value will be updated when the editor loses focus
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
  };

  const toggleEditor = () => {
    if (!isRichText && editorRef.current) {
      // Initialize editor with current value
      editorRef.current.innerHTML = value || '';
      setIsInitialized(true);
    }
    setIsRichText(!isRichText);
  };

  const formatText = (command: string) => {
    document.execCommand(command);
    updateValue();
  };

  const insertList = (ordered: boolean = false) => {
    if (ordered) {
      document.execCommand('insertOrderedList');
    } else {
      document.execCommand('insertUnorderedList');
    }
    updateValue();
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
          {/* Toolbar */}
          <div className="bg-gray-50 dark:bg-gray-700 p-2 border-b border-gray-300 dark:border-gray-600 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => formatText('bold')}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              title="Fett (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => formatText('italic')}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              title="Kursiv (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => formatText('underline')}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              title="Unterstrichen (Ctrl+U)"
            >
              <u>U</u>
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
            <button
              type="button"
              onClick={() => insertList(false)}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              title="Aufzählung"
            >
              • Liste
            </button>
            <button
              type="button"
              onClick={() => insertList(true)}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              title="Nummerierte Liste"
            >
              1. Liste
            </button>
          </div>
          
          {/* Editor Content */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={updateValue}
            onKeyDown={handleKeyDown}
            className="p-3 min-h-[200px] focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            style={{ fontSize: '14px', fontFamily: 'inherit' }}
            suppressContentEditableWarning={true}
          >
            {!isInitialized && value}
          </div>
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
          ? 'Rich Text Editor: Verwende die Toolbar für Formatierung. Bilder können per Upload eingefügt werden. Tastenkürzel: Ctrl+B (fett), Ctrl+I (kursiv), Ctrl+U (unterstrichen).'
          : 'Normaler Text: Einfache Texteingabe ohne Formatierung.'
        }
      </p>
    </div>
  );
};

export default RichTextEditor;