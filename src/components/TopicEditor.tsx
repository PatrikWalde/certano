import React, { useState } from 'react';
import { Topic } from '../types';

interface TopicEditorProps {
  topic?: Topic;
  existingTopics?: Topic[];
  onClose: () => void;
  onSave: (topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const TopicEditor: React.FC<TopicEditorProps> = ({ topic, existingTopics = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: topic?.name || '',
    description: topic?.description || '',
    icon: topic?.icon || '📚',
    color: topic?.color || '#3b82f6',
    isActive: topic?.isActive ?? true,
    orderIndex: topic?.orderIndex || 999,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    { value: '#3b82f6', label: 'Blau', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
    { value: '#ef4444', label: 'Rot', bgClass: 'bg-red-100', textClass: 'text-red-800' },
    { value: '#10b981', label: 'Grün', bgClass: 'bg-green-100', textClass: 'text-green-800' },
    { value: '#f59e0b', label: 'Gelb', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
    { value: '#8b5cf6', label: 'Lila', bgClass: 'bg-purple-100', textClass: 'text-purple-800' },
    { value: '#f97316', label: 'Orange', bgClass: 'bg-orange-100', textClass: 'text-orange-800' },
    { value: '#ec4899', label: 'Pink', bgClass: 'bg-pink-100', textClass: 'text-pink-800' },
    { value: '#6366f1', label: 'Indigo', bgClass: 'bg-indigo-100', textClass: 'text-indigo-800' },
    { value: '#06b6d4', label: 'Cyan', bgClass: 'bg-cyan-100', textClass: 'text-cyan-800' },
    { value: '#84cc16', label: 'Lime', bgClass: 'bg-lime-100', textClass: 'text-lime-800' },
    { value: '#f43f5e', label: 'Rose', bgClass: 'bg-rose-100', textClass: 'text-rose-800' },
    { value: '#a855f7', label: 'Violett', bgClass: 'bg-violet-100', textClass: 'text-violet-800' },
  ];

  // Icons ohne Duplikate - jeder Icon nur einmal
  const popularIcons = [
    '📚', '🚦', '🛑', '🚂', '⚠️', '🔧', '⚡', '🌐', '💻', '🔍', '📊', '🎯', '⭐', '💡', '🔒',
    '🚗', '🚲', '🚌', '🚅', '✈️', '🚢', '🚁', '🚀', '🎮', '🎵', '🎬', '📺', '📷', '🎨', '🏠', '🏢',
    '🌍', '🌙', '☀️', '🌈', '🌊', '🏔️', '🌲', '🌸', '🍀', '🌻', '🌹', '🐾', '🦋', '🐝', '🦅',
    '⚙️', '🔨', '🛠️', '📐', '🧮', '🔬', '🧪', '🔭', '📡', '💾', '🖥️', '⌨️', '🖱️', '📞', '📟'
  ];

  // Get available order positions
  const getAvailableOrderPositions = () => {
    const maxOrder = existingTopics.length > 0 ? Math.max(...existingTopics.map(t => t.orderIndex)) : 0;
    const positions = [];
    
    for (let i = 1; i <= maxOrder + 1; i++) {
      positions.push(i);
    }
    
    return positions;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Themenname ist erforderlich';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Themenname sollte mindestens 3 Zeichen lang sein';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Beschreibung sollte mindestens 10 Zeichen lang sein';
    }

    if (!formData.icon.trim()) {
      newErrors.icon = 'Icon ist erforderlich';
    }

    if (formData.orderIndex < 1) {
      newErrors.orderIndex = 'Reihenfolge muss mindestens 1 sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const topicData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon.trim(),
        color: formData.color,
        isActive: formData.isActive,
        orderIndex: formData.orderIndex,
      };

      onSave(topicData);
    } catch (error) {
      console.error('Error saving topic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorClasses = (colorValue: string) => {
    const color = colors.find(c => c.value === colorValue);
    return color ? `${color.bgClass} ${color.textClass}` : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-700 dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
              {topic ? 'Thema bearbeiten' : 'Neues Thema hinzufügen'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Themenname *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="z.B. Verkehrsregeln"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reihenfolge
                </label>
                <select
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.orderIndex ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {getAvailableOrderPositions().map((position) => (
                    <option key={position} value={position}>
                      Position {position}
                    </option>
                  ))}
                </select>
                {errors.orderIndex && <p className="text-red-500 text-sm mt-1">{errors.orderIndex}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Beschreibe den Inhalt dieses Themas..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Visual Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="text-xl mr-2">{formData.icon}</span>
                    Icon auswählen
                  </button>
                  
                  {showIconPicker && (
                    <div className="absolute z-10 mt-1 w-80 bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-3">
                        <div className="grid grid-cols-8 gap-2">
                          {popularIcons.map((icon, index) => (
                            <button
                              key={`${icon}-${index}`}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, icon });
                                setShowIconPicker(false);
                              }}
                              className="w-10 h-10 text-xl border-2 rounded-md flex items-center justify-center transition-colors hover:border-blue-500 hover:bg-blue-50"
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <input
                            type="text"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Eigenes Icon eingeben"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {errors.icon && <p className="text-red-500 text-sm mt-1">{errors.icon}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farbe
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${getColorClasses(formData.color)}`}
                  >
                    <span className="w-4 h-4 rounded-full mr-2 inline-block" style={{ backgroundColor: formData.color }}></span>
                    Farbe auswählen
                  </button>
                  
                  {showColorPicker && (
                    <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-gray-700 border border-gray-300 rounded-md shadow-lg">
                      <div className="p-3">
                        <div className="grid grid-cols-6 gap-2">
                          {colors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, color: color.value });
                                setShowColorPicker(false);
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-colors hover:scale-110 ${
                                formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color.value }}
                              title={color.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorschau
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{formData.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{formData.name || 'Themenname'}</div>
                  <div className="text-sm text-gray-600">{formData.description || 'Beschreibung'}</div>
                </div>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses(formData.color)}`}>
                    Position {formData.orderIndex}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Thema ist aktiv (sichtbar für Benutzer)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Wird gespeichert...' : (topic ? 'Aktualisieren' : 'Erstellen')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TopicEditor;
