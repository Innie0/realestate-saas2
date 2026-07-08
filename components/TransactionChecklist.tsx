// TransactionChecklist component
// Interactive checklist for transaction tasks

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, Circle, Plus, Trash2, 
  Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { TransactionChecklistItem } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface TransactionChecklistProps {
  transactionId: string;
  items: TransactionChecklistItem[];
  onUpdate: () => void; // Callback to refresh data
  onItemToggle?: (itemId: string, isCompleted: boolean) => void; // Optimistic update callback
}

export default function TransactionChecklist({ 
  transactionId, 
  items, 
  onUpdate,
  onItemToggle
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

  // Category display info — matches console design system semantic chips
  const categoryInfo: Record<string, { label: string; color: string }> = {
    inspection: { label: 'Inspection', color: 'bg-gray-150 text-gray-700' },
    appraisal: { label: 'Appraisal', color: 'bg-gray-150 text-gray-700' },
    financing: { label: 'Financing', color: 'bg-teal-50 text-teal-700' },
    title: { label: 'Title', color: 'bg-amber-50 text-amber-700' },
    closing: { label: 'Closing', color: 'bg-rose-50 text-rose-700' },
    other: { label: 'Other', color: 'bg-gray-150 text-gray-700' },
  };

  // Toggle item completion
  const toggleItem = async (item: TransactionChecklistItem) => {
    // Optimistic update first
    if (onItemToggle) {
      onItemToggle(item.id, !item.is_completed);
    }
    
    try {
      const response = await fetch(`/api/transactions/${transactionId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          is_completed: !item.is_completed,
        }),
      });

      if (!response.ok) {
        // If API call fails, revert by calling onUpdate
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      // Revert on error
      onUpdate();
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
      <div className="bg-gray-50 rounded-[10px] p-4 border border-gray-150">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-gray-900">Overall Progress</span>
          <span className="text-[12.5px] text-gray-450">
            {completedCount} of {totalCount} completed ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-brand-100 rounded-full h-1.5">
          <div 
            className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
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
          <div key={category} className="border border-gray-150 rounded-[10px] overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${info.color}`}>
                  {info.label}
                </span>
                <span className="ml-3 text-[12.5px] text-gray-450">
                  {categoryCompleted}/{categoryItems.length} completed
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-450" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-450" />
              )}
            </button>

            {/* Category items */}
            {isExpanded && (
              <div className="divide-y divide-gray-150">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item)}
                      disabled={isLoading}
                      className="flex-shrink-0 mr-3"
                    >
                      {item.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>

                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13.5px] font-medium ${
                        item.is_completed ? 'text-gray-450 line-through' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </p>
                      {item.due_date && (
                        <p className="flex items-center text-[11.5px] text-gray-450 mt-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {format(new Date(item.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                      {item.completed_at && (
                        <p className="text-[11.5px] text-teal-700 mt-0.5">
                          Completed {format(new Date(item.completed_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={isLoading}
                      className="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="border border-gray-150 rounded-[10px] p-4 space-y-3 bg-gray-50">
          <Input
            label="Task Title"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="e.g., Review inspection report"
            autoFocus
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={newItemCategory}
              onChange={(value) => setNewItemCategory(value as typeof newItemCategory)}
              triggerClassName="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white text-gray-900"
              options={Object.entries(categoryInfo).map(([key, info]) => ({
                value: key,
                label: info.label,
              }))}
            />
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
          className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-200 rounded-[10px] text-gray-450 hover:border-gray-300 hover:text-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Task
        </button>
      )}
    </div>
  );
}
