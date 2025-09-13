import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Load Froala Editor from local files
declare global {
  interface Window {
    FroalaEditor: any;
  }
}

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
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const froalaInstance = useRef<any>(null);

  // Load Froala Editor scripts
  useEffect(() => {
    const loadFroala = () => {
      if (window.FroalaEditor) {
        setIsInitialized(true);
        return;
      }

      // Load CSS
      const css1 = document.createElement('link');
      css1.rel = 'stylesheet';
      css1.href = '/froala_editor_4/css/froala_editor.pkgd.min.css';
      document.head.appendChild(css1);

      const css2 = document.createElement('link');
      css2.rel = 'stylesheet';
      css2.href = '/froala_editor_4/css/froala_style.min.css';
      document.head.appendChild(css2);

      // Load JS
      const script = document.createElement('script');
      script.src = '/froala_editor_4/js/froala_editor.pkgd.min.js';
      script.onload = () => {
        setIsInitialized(true);
      };
      document.head.appendChild(script);
    };

    loadFroala();
  }, []);

  // Initialize editor
  useEffect(() => {
    if (isInitialized && isRichText && editorRef.current && !froalaInstance.current) {
      // Wait a bit for the DOM to be ready
      setTimeout(() => {
        if (editorRef.current && window.FroalaEditor) {
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
            events: {
              'image.beforeUpload': function (images: any) {
                // Custom image upload handler - upload to Supabase
                if (images && images.length > 0) {
                  const file = images[0];
                  handleImageUpload(file).then(imageUrl => {
                    // Insert the image with the Supabase URL
                    if (froalaInstance.current) {
                      froalaInstance.current.image.insert(imageUrl, {
                        width: 300,
                        height: 200,
                        alt: 'Uploaded image'
                      });
                    }
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
                if (froalaInstance.current && froalaInstance.current.html) {
                  const content = froalaInstance.current.html.get();
                  onChange(content);
                }
              }
            }
          };

          try {
            froalaInstance.current = new window.FroalaEditor(editorRef.current, config);
          } catch (error) {
            console.error('Error initializing Froala Editor:', error);
          }
        }
      }, 100);
    }

    return () => {
      if (froalaInstance.current) {
        try {
          froalaInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying Froala Editor:', error);
        }
        froalaInstance.current = null;
      }
    };
  }, [isInitialized, isRichText, placeholder, onChange]);

  // Update editor content when value changes
  useEffect(() => {
    if (froalaInstance.current && froalaInstance.current.html && value !== froalaInstance.current.html.get()) {
      froalaInstance.current.html.set(value);
    }
  }, [value]);

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
      {isRichText ? (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <div ref={editorRef}></div>
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
