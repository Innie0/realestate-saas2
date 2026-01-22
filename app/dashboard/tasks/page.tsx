'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Sparkles, Clock, Send, Loader2, CheckCircle2, Edit2, Save, X, Wand2 } from 'lucide-react';

interface Task {
  id: string;
  prompt: string;
  output: string | null;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedOutput, setEditedOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // AI refinement state
  const [refiningTaskId, setRefiningTaskId] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [selectedTaskForRefine, setSelectedTaskForRefine] = useState<Task | null>(null);

  // Fetch existing tasks on page load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const response = await fetch('/api/tasks');
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
      } else {
        setError(result.error || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        // Add new task to the top of the list
        setTasks(prev => [result.data, ...prev]);
        setPrompt(''); // Clear input
      } else {
        setError(result.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditedOutput(task.output || '');
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditedOutput('');
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editedOutput.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, output: editedOutput }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the task in the list
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? { ...task, output: editedOutput } : task
          )
        );
        setEditingTaskId(null);
        setEditedOutput('');
      } else {
        setError(result.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRefineModal = (task: Task) => {
    setSelectedTaskForRefine(task);
    setShowRefineModal(true);
    setRefineInstruction('');
  };

  const handleRefineWithAI = async () => {
    if (!selectedTaskForRefine || !refineInstruction.trim()) return;

    setRefiningTaskId(selectedTaskForRefine.id);
    setError(null);

    try {
      const response = await fetch('/api/tasks/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTaskForRefine.id,
          currentOutput: selectedTaskForRefine.output,
          instruction: refineInstruction,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update the task in the list
        setTasks(prev =>
          prev.map(task =>
            task.id === selectedTaskForRefine.id ? result.data : task
          )
        );
        setShowRefineModal(false);
        setRefineInstruction('');
        setSelectedTaskForRefine(null);
      } else {
        setError(result.error || 'Failed to refine with AI');
      }
    } catch (err) {
      console.error('Error refining task:', err);
      setError('Failed to refine with AI. Please try again.');
    } finally {
      setRefiningTaskId(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <Header 
        title="AI Tasks" 
        subtitle="Let AI help you complete your real estate tasks"
      />

      {/* Page content */}
      <div className="p-6 text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input Form */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What do you want to do?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Draft an email to a client, create a listing description, write social media posts..."
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Tasks List */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-white">Recent Tasks</h2>
            </div>

            {isLoadingTasks ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-24 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-white/10">
                <Sparkles className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No tasks yet</h3>
                <p className="text-gray-400">
                  Create your first task above and let AI help you get it done!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all"
                  >
                    {/* Task Prompt */}
                    <div className="mb-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg mt-0.5 border border-white/10">
                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{task.prompt}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(task.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI Output */}
                    {task.output && (
                      <div className="ml-11">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          {editingTaskId === task.id ? (
                            // Edit Mode
                            <div className="space-y-3">
                              <textarea
                                value={editedOutput}
                                onChange={(e) => setEditedOutput(e.target.value)}
                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none min-h-[150px]"
                                disabled={isSaving}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(task.id)}
                                  disabled={isSaving || !editedOutput.trim()}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white hover:bg-white/20 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3.5 h-3.5" />
                                      Save
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isSaving}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50 border border-white/10"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div className="space-y-3">
                              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {task.output}
                              </p>
                              <div className="flex gap-2 pt-3 border-t border-white/10">
                                <button
                                  onClick={() => handleStartEdit(task)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors border border-white/10"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleOpenRefineModal(task)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white hover:bg-white/20 text-xs rounded-lg transition-colors border border-white/10"
                                >
                                  <Wand2 className="w-3 h-3" />
                                  Refine with AI
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Refine Modal */}
      {showRefineModal && selectedTaskForRefine && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                Refine with AI
              </h3>
              <button
                onClick={() => {
                  setShowRefineModal(false);
                  setRefineInstruction('');
                  setSelectedTaskForRefine(null);
                }}
                disabled={refiningTaskId !== null}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current Output */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Output:
                </label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {selectedTaskForRefine.output}
                  </p>
                </div>
              </div>

              {/* Refinement Instruction */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What would you like to change?
                </label>
                <textarea
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  placeholder="e.g., Make it more professional, add more details, make it shorter, change the tone..."
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none"
                  rows={3}
                  disabled={refiningTaskId !== null}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowRefineModal(false);
                    setRefineInstruction('');
                    setSelectedTaskForRefine(null);
                  }}
                  disabled={refiningTaskId !== null}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 border border-white/10"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleRefineWithAI}
                  disabled={refiningTaskId !== null || !refineInstruction.trim()}
                >
                  {refiningTaskId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Refine with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

