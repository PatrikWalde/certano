import React, { useState } from 'react';
import { ChapterData, Topic } from '../types';
import ChapterEditor from './ChapterEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableChapterTableProps {
  chapters: ChapterData[];
  topics?: Topic[];
  onEdit: (chapter: ChapterData) => void;
  onDelete: (chapterId: string) => void;
  onReorder: (chapters: ChapterData[]) => void;
}

interface SortableChapterRowProps {
  chapter: ChapterData;
  topics: Topic[];
  onEdit: (chapter: ChapterData) => void;
  onDelete: (chapterId: string) => void;
  getChapterIcon: (icon: string, chapterName: string) => string;
  getTopicName: (topicId?: string) => string;
  getTopicIcon: (topicId?: string) => string;
}

const SortableChapterRow: React.FC<SortableChapterRowProps> = ({ 
  chapter, 
  topics,
  onEdit, 
  onDelete, 
  getChapterIcon,
  getTopicName,
  getTopicIcon
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <button
            {...attributes}
            {...listeners}
            className="mr-3 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            title="Ziehen zum Sortieren"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </button>
          <span className="text-2xl mr-3">{getChapterIcon(chapter.icon, chapter.name)}</span>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{chapter.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Position {chapter.order}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-lg mr-2">{getTopicIcon(chapter.topicId)}</span>
          <span className="text-sm text-gray-900 dark:text-white">{getTopicName(chapter.topicId)}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
        <div className="truncate" title={chapter.description}>
          {chapter.description}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          chapter.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {chapter.isActive ? 'Aktiv' : 'Inaktiv'}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => onEdit(chapter)}
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          Bearbeiten
        </button>
        <button
          onClick={() => onDelete(chapter.id)}
          className="text-red-600 hover:text-red-900"
        >
          Löschen
        </button>
      </td>
    </tr>
  );
};

const SortableChapterTable: React.FC<SortableChapterTableProps> = ({ 
  chapters, 
  topics = [], 
  onEdit, 
  onDelete, 
  onReorder 
}) => {
  const [editingChapter, setEditingChapter] = useState<ChapterData | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = chapters.findIndex((chapter) => chapter.id === active.id);
      const newIndex = chapters.findIndex((chapter) => chapter.id === over?.id);

      const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
      
      // Update order indices
      const updatedChapters = reorderedChapters.map((chapter, index) => ({
        ...chapter,
        order: index + 1,
      }));

      onReorder(updatedChapters);
    }
  };

  const handleSaveChapter = async (chapterData: Omit<ChapterData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingChapter) {
      // Update existing chapter
      const updatedChapter = { ...editingChapter, ...chapterData };
      onEdit(updatedChapter);
      setEditingChapter(null);
    } else {
      // Create new chapter
      const newChapter: ChapterData = {
        id: `temp-${Date.now()}`, // Temporary ID for new chapters
        ...chapterData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onEdit(newChapter);
      setShowAddForm(false);
    }
  };

  const handleEdit = (chapter: ChapterData) => {
    setEditingChapter(chapter);
    setShowAddForm(false);
  };

  const handleDelete = (chapterId: string) => {
    if (window.confirm('Möchtest du dieses Kapitel wirklich löschen?')) {
      onDelete(chapterId);
    }
  };

  const getChapterIcon = (icon: string, chapterName: string) => {
    if (!icon || icon.trim() === '' || icon === '️') {
      // Return default icons based on chapter name
      if (chapterName.toLowerCase().includes('verkehr')) return '🚦';
      if (chapterName.toLowerCase().includes('vorfahrt')) return '⚠️';
      if (chapterName.toLowerCase().includes('geschwindigkeit')) return '⚡';
      if (chapterName.toLowerCase().includes('überholen')) return '🔄';
      if (chapterName.toLowerCase().includes('ampel')) return '🚥';
      return '📚'; // Default fallback
    }
    return icon;
  };

  const getTopicName = (topicId?: string) => {
    if (!topicId) return 'Kein Thema';
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unbekanntes Thema';
  };

  const getTopicIcon = (topicId?: string) => {
    if (!topicId) return '📚';
    const topic = topics.find(t => t.id === topicId);
    return topic ? topic.icon : '📚';
  };

  const getColorClasses = (colorValue: string) => {
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-100 text-blue-800',
      '#ef4444': 'bg-red-100 text-red-800',
      '#10b981': 'bg-green-100 text-green-800',
      '#f59e0b': 'bg-yellow-100 text-yellow-800',
      '#8b5cf6': 'bg-purple-100 text-purple-800',
      '#f97316': 'bg-orange-100 text-orange-800',
      '#ec4899': 'bg-pink-100 text-pink-800',
      '#6366f1': 'bg-indigo-100 text-indigo-800',
      '#06b6d4': 'bg-cyan-100 text-cyan-800',
      '#84cc16': 'bg-lime-100 text-lime-800',
      '#f43f5e': 'bg-rose-100 text-rose-800',
      '#a855f7': 'bg-violet-100 text-violet-800',
    };
    return colorMap[colorValue] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kapitel verwalten</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Neues Kapitel hinzufügen
        </button>
      </div>

      {/* Chapters Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md transition-colors duration-300">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kapitel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <SortableContext items={chapters.map(chapter => chapter.id)} strategy={verticalListSortingStrategy}>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {chapters.map((chapter) => (
                  <SortableChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    topics={topics}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getChapterIcon={getChapterIcon}
                    getTopicName={getTopicName}
                    getTopicIcon={getTopicIcon}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>

        {chapters.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Kapitel vorhanden</h3>
            <p className="text-gray-500 dark:text-gray-400">Erstelle dein erstes Kapitel, um mit dem Lernen zu beginnen.</p>
          </div>
        )}
      </div>

      {/* Chapter Editor Modal */}
      {(editingChapter || showAddForm) && (
        <ChapterEditor
          chapter={editingChapter || undefined}
          existingChapters={chapters}
          topics={topics}
          onClose={() => {
            setEditingChapter(null);
            setShowAddForm(false);
          }}
          onSave={handleSaveChapter}
        />
      )}
    </div>
  );
};

export default SortableChapterTable;
