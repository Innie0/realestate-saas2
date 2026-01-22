// TransactionChecklist component
// Interactive checklist for transaction tasks

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, Circle, Plus, Trash2, Edit2, 
  Calendar, ChevronDown, ChevronUp, GripVertical 
} from 'lucide-react';
import { TransactionChecklistItem } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface TransactionChecklistProps {
  transactionId: string;
  items: TransactionChecklistItem[];
  onUpdate: () => void; // Callback to refresh data
}

export default function TransactionChecklist({ 
  transactionId, 
  items, 
  onUpdate 
}: TransactionChecklistProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<TransactionChecklistItem['category']>('other');
  const [newItemDueDate, setNewItemDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['inspection', 'appraisal', 'financing', 'title', 'closing', 'other'])
  );

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, TransactionChecklistItem[]>);

  // Category display info
  const categoryInfo: Record<string, { label: string; color: string }> = {
    inspection: { label: 'Inspection', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
    appraisal: { label: 'Appraisal', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
    financing: { label: 'Financing', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
    title: { label: 'Title', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
    closing: { label: 'Closing', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
    other: { label: 'Other', color: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
  };

  // Toggle item completion
  const toggleItem = async (item: TransactionChecklistItem) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          is_completed: !item.is_completed,
        }),
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new item
  const addItem = async () => {
    if (!newItemTitle.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${transactionId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItemTitle.trim(),
          category: newItemCategory,
          due_date: newItemDueDate || null,
        }),
      });

      if (response.ok) {
        setNewItemTitle('');
        setNewItemDueDate('');
        setIsAdding(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this checklist item?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/checklist?item_id=${itemId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Calculate progress
  const completedCount = items.filter(item => item.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Overall Progress</span>
          <span className="text-sm text-gray-400">
            {completedCount} of {totalCount} completed ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grouped items */}
      {Object.entries(categoryInfo).map(([category, info]) => {
        const categoryItems = groupedItems[category] || [];
        if (categoryItems.length === 0) return null;

        const categoryCompleted = categoryItems.filter(i => i.is_completed).length;
        const isExpanded = expandedCategories.has(category);

        return (
          <div key={category} className="border border-gray-700/50 rounded-lg overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${info.color}`}>
                  {info.label}
                </span>
                <span className="ml-3 text-sm text-gray-400">
                  {categoryCompleted}/{categoryItems.length} completed
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Category items */}
            {isExpanded && (
              <div className="divide-y divide-gray-700/30">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`flex items-center p-3 hover:bg-gray-800/30 transition-colors ${
                      item.is_completed ? 'bg-green-500/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item)}
                      disabled={isLoading}
                      className="flex-shrink-0 mr-3"
                    >
                      {item.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-600 hover:text-gray-500" />
                      )}
                    </button>

                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        item.is_completed ? 'text-gray-500 line-through' : 'text-white'
                      }`}>
                        {item.title}
                      </p>
                      {item.due_date && (
                        <p className="flex items-center text-xs text-gray-400 mt-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                      {item.completed_at && (
                        <p className="text-xs text-green-400 mt-0.5">
                          Completed {format(new Date(item.completed_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={isLoading}
                      className="flex-shrink-0 ml-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new item */}
      {isAdding ? (
        <div className="border border-gray-700/50 rounded-lg p-4 space-y-3 bg-gray-800/30">
          <Input
            label="Task Title"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="e.g., Review inspection report"
            autoFocus
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Category
              </label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-800/50 text-white"
              >
                {Object.entries(categoryInfo).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Due Date (optional)"
              type="date"
              value={newItemDueDate}
              onChange={(e) => setNewItemDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={addItem} 
              isLoading={isLoading}
              disabled={!newItemTitle.trim()}
            >
              Add Task
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-700/50 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Custom Task
        </button>
      )}
    </div>
  );
}
