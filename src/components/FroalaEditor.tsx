import React, { useState, useEffect } from 'react';
import FroalaEditor from 'react-froala-wysiwyg';
import { supabase } from '../lib/supabase';

// Import Froala Editor CSS from local files
import '/froala_editor_4/css/froala_editor.pkgd.min.css';
import '/froala_editor_4/css/froala_style.min.css';

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
  const [editorConfig, setEditorConfig] = useState<any>(null);

  // Initialize editor config
  useEffect(() => {
    const config = {
      placeholderText: placeholder,
      height: 200,
      toolbarButtons: {
        'moreText': {
          'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'textColor', 'backgroundColor']
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
      events: {
        'image.beforeUpload': function (files: any) {
          // Custom image upload handler - upload to Supabase
          const editor = this as any;
          if (files && files.length > 0) {
            const file = files[0];
            handleImageUpload(file).then(imageUrl => {
              // Insert the image with the Supabase URL
              editor.image.insert(imageUrl, null, null, editor.image.get());
            }).catch(error => {
              console.error('Error uploading image:', error);
              alert('Fehler beim Hochladen des Bildes');
            });
          }
          return false; // Prevent default upload
        },
        'image.inserted': function (img: any) {
          // Handle image insertion
          console.log('Image inserted:', img);
        },
        'contentChanged': function () {
          if ((this as any).html) {
            const content = (this as any).html.get();
            onChange(content);
          }
        }
      }
    };

    setEditorConfig(config);
  }, [placeholder, onChange]);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
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
    }
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
      {isRichText && editorConfig ? (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <FroalaEditor
            tag="textarea"
            model={value}
            onModelChange={onChange}
            config={editorConfig}
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