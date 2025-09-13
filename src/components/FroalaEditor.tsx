import React, { useState } from 'react';
import FroalaEditor from 'react-froala-wysiwyg';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import { supabase } from '../lib/supabase';

interface FroalaEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const FroalaEditorComponent: React.FC<FroalaEditorProps> = ({
  value,
  onChange,
  placeholder = 'Fragentext eingeben...',
  className = ''
}) => {
  const [isRichText, setIsRichText] = useState(false);

  const config = {
    placeholderText: placeholder,
    height: 200,
    toolbarButtons: {
      'moreText': {
        'buttons': ['bold', 'italic', 'underline', 'subscript', 'superscript', 'textColor', 'backgroundColor']
      },
      'moreParagraph': {
        'buttons': ['formatUL', 'formatOL', 'indent', 'outdent', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify']
      },
      'moreRich': {
        'buttons': ['insertImage', 'insertTable', 'insertLink', 'insertHR']
      },
      'moreMisc': {
        'buttons': ['undo', 'redo', 'fullscreen', 'print', 'getPDF', 'spellChecker', 'selectAll', 'html', 'help']
      }
    },
    imageUploadURL: '/api/upload-image',
    imageUploadParams: {
      bucket: 'images'
    },
    imageUploadMethod: 'POST',
    imageUploadToS3: false,
    imageManagerLoadURL: '/api/list-images',
    imageManagerDeleteURL: '/api/delete-image',
    imageManagerDeleteMethod: 'DELETE',
    events: {
      'image.beforeUpload': function (images: any) {
        // Custom image upload handler
        return false; // Prevent default upload
      },
      'image.inserted': function (img: any) {
        // Handle image insertion
        console.log('Image inserted:', img);
      },
      'contentChanged': function () {
        // Content changed event
      }
    }
  };

  const handleModelChange = (model: string) => {
    onChange(model);
  };

  const toggleEditor = () => {
    setIsRichText(!isRichText);
  };

  return (
    <div className={`froala-editor-wrapper ${className}`}>
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
        </div>
      </div>

      {/* Editor */}
      {isRichText ? (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <FroalaEditor
            tag='textarea'
            model={value}
            onModelChange={handleModelChange}
            config={config}
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
          ? 'Rich Text Editor: Verwende die Toolbar für Formatierung. Bilder können per Upload eingefügt werden.'
          : 'Normaler Text: Einfache Texteingabe ohne Formatierung.'
        }
      </p>
    </div>
  );
};

export default FroalaEditorComponent;
