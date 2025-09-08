import React, { useState } from 'react';
import { Topic } from '../types';
import TopicEditor from './TopicEditor';
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

interface TopicTableProps {
  topics: Topic[];
  onEdit: (topic: Topic) => void;
  onDelete: (topicId: string) => void;
  onReorder: (topics: Topic[]) => void;
}

interface SortableTopicRowProps {
  topic: Topic;
  onEdit: (topic: Topic) => void;
  onDelete: (topicId: string) => void;
  getColorClasses: (color: string) => string;
}

const SortableTopicRow: React.FC<SortableTopicRowProps> = ({ 
  topic, 
  onEdit, 
  onDelete, 
  getColorClasses 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

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
          <span className="text-2xl mr-3">{topic.icon}</span>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{topic.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {topic.id}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
        <div className="truncate" title={topic.description}>
          {topic.description}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses(topic.color)}`}>
          Position {topic.orderIndex}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          topic.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {topic.isActive ? 'Aktiv' : 'Inaktiv'}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => onEdit(topic)}
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          Bearbeiten
        </button>
        <button
          onClick={() => onDelete(topic.id)}
          className="text-red-600 hover:text-red-900"
        >
          Löschen
        </button>
      </td>
    </tr>
  );
};

const TopicTable: React.FC<TopicTableProps> = ({ topics, onEdit, onDelete, onReorder }) => {
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
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
      const oldIndex = topics.findIndex((topic) => topic.id === active.id);
      const newIndex = topics.findIndex((topic) => topic.id === over?.id);

      const reorderedTopics = arrayMove(topics, oldIndex, newIndex);
      
      // Update order indices
      const updatedTopics = reorderedTopics.map((topic, index) => ({
        ...topic,
        orderIndex: index + 1,
      }));

      onReorder(updatedTopics);
    }
  };

  const handleSaveTopic = async (topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTopic) {
      // Update existing topic
      const updatedTopic = { ...editingTopic, ...topicData };
      onEdit(updatedTopic);
      setEditingTopic(null);
    } else {
      // Create new topic
      const newTopic: Topic = {
        id: `temp-${Date.now()}`, // Temporary ID for new topics
        ...topicData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onEdit(newTopic);
      setShowAddForm(false);
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setShowAddForm(false);
  };

  const handleDelete = (topicId: string) => {
    if (window.confirm('Möchtest du dieses Thema wirklich löschen? Alle zugehörigen Kapitel werden ebenfalls gelöscht.')) {
      onDelete(topicId);
    }
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Themen verwalten</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Neues Thema hinzufügen
        </button>
      </div>

      {/* Topics Table */}
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
                  Thema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reihenfolge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <SortableContext items={topics.map(topic => topic.id)} strategy={verticalListSortingStrategy}>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topics.map((topic) => (
                  <SortableTopicRow
                    key={topic.id}
                    topic={topic}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getColorClasses={getColorClasses}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>

        {topics.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Keine Themen vorhanden</h3>
            <p className="text-gray-500 dark:text-gray-400">Erstelle dein erstes Thema, um mit der Organisation zu beginnen.</p>
          </div>
        )}
      </div>

      {/* Topic Editor Modal */}
      {(editingTopic || showAddForm) && (
        <TopicEditor
          topic={editingTopic || undefined}
          existingTopics={topics}
          onClose={() => {
            setEditingTopic(null);
            setShowAddForm(false);
          }}
          onSave={handleSaveTopic}
        />
      )}
    </div>
  );
};

export default TopicTable;
