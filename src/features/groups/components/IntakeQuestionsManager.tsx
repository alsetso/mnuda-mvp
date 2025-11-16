'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { GroupService } from '../services/groupService';
import type { IntakeQuestion } from '../types';
import { useToast } from '@/features/ui/hooks/useToast';

interface IntakeQuestionsManagerProps {
  groupId: string;
}

export function IntakeQuestionsManager({ groupId }: IntakeQuestionsManagerProps) {
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const { success, error: showError } = useToast();

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await GroupService.getIntakeQuestions(groupId);
      setQuestions(data);
    } catch (err) {
      showError('Failed to Load', err instanceof Error ? err.message : 'Could not load questions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleSave = async () => {
    if (editingIndex === null) return;

    const newQuestions = [...questions];
    newQuestions[editingIndex] = {
      ...newQuestions[editingIndex],
      question_text: editText.trim(),
    };

    try {
      await GroupService.setIntakeQuestions(
        groupId,
        newQuestions.map((q, idx) => ({
          question_text: q.question_text,
          question_order: idx + 1,
        }))
      );
      await loadQuestions();
      setEditingIndex(null);
      setEditText('');
      success('Question Updated', 'The intake question has been updated.');
    } catch (err) {
      showError('Failed to Update', err instanceof Error ? err.message : 'Could not update question.');
    }
  };

  const handleAdd = async () => {
    if (questions.length >= 3) {
      showError('Limit Reached', 'Maximum 3 intake questions allowed.');
      return;
    }

    const newQuestion: IntakeQuestion = {
      id: `temp-${Date.now()}`,
      group_id: groupId,
      question_text: '',
      question_order: questions.length + 1,
      created_at: new Date().toISOString(),
    };

    setQuestions([...questions, newQuestion]);
    setEditingIndex(questions.length);
    setEditText('');
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const newQuestions = questions.filter((_, i) => i !== index).map((q, idx) => ({
      ...q,
      question_order: idx + 1,
    }));

    try {
      await GroupService.setIntakeQuestions(
        groupId,
        newQuestions.map((q, idx) => ({
          question_text: q.question_text,
          question_order: idx + 1,
        }))
      );
      await loadQuestions();
      success('Question Deleted', 'The intake question has been removed.');
    } catch (err) {
      showError('Failed to Delete', err instanceof Error ? err.message : 'Could not delete question.');
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(questions[index].question_text);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
    loadQuestions(); // Reload to reset any unsaved changes
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black">Intake Questions</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add up to 3 questions that new members must answer when requesting to join.
          </p>
        </div>
        {questions.length < 3 && (
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Question
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-2">No intake questions set</p>
          <p className="text-sm text-gray-400">
            Add questions to collect information from new members during the join request.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4"
            >
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Question {index + 1}
                    </label>
                    <textarea
                      value={editText}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 200) {
                          setEditText(value);
                        }
                      }}
                      placeholder="Enter your question..."
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                      autoFocus
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editText.length}/200 characters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={!editText.trim()}
                      className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-500">Question {index + 1}</span>
                    </div>
                    <p className="text-gray-900">{question.question_text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(index)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Edit question"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      aria-label="Delete question"
                    >
                      <TrashIcon className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && questions.length < 3 && (
        <button
          onClick={handleAdd}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-300"
        >
          <PlusIcon className="w-5 h-5" />
          Add Another Question
        </button>
      )}
    </div>
  );
}

