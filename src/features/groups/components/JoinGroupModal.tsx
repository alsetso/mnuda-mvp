'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { GroupService } from '../services/groupService';
import { useToast } from '@/features/ui/hooks/useToast';
import type { Group, IntakeQuestion, JoinGroupRequest } from '../types';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onJoinSuccess: () => void;
}

export function JoinGroupModal({ isOpen, onClose, group, onJoinSuccess }: JoinGroupModalProps) {
  const [intakeQuestions, setIntakeQuestions] = useState<IntakeQuestion[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen && group.id) {
      loadIntakeQuestions();
    } else {
      // Reset state when modal closes
      setResponses({});
      setErrors({});
      setIsLoadingQuestions(true);
    }
  }, [isOpen, group.id]);

  const loadIntakeQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const questions = await GroupService.getIntakeQuestions(group.id);
      setIntakeQuestions(questions);
      
      // Initialize responses object
      const initialResponses: Record<string, string> = {};
      questions.forEach(q => {
        initialResponses[q.id] = '';
      });
      setResponses(initialResponses);
    } catch (err) {
      console.error('Error loading intake questions:', err);
      showError('Failed to Load', 'Could not load intake questions.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    intakeQuestions.forEach(question => {
      const response = responses[question.id]?.trim();
      if (!response || response.length === 0) {
        newErrors[question.id] = 'This question is required';
      } else if (response.length > 500) {
        newErrors[question.id] = 'Response must be 500 characters or less';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (): boolean => {
    if (intakeQuestions.length === 0) return true;
    
    return intakeQuestions.every(question => {
      const response = responses[question.id]?.trim();
      return response && response.length > 0 && response.length <= 500;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResponses()) {
      return;
    }

    setIsJoining(true);
    setErrors({});

    try {
      const request: JoinGroupRequest | undefined = intakeQuestions.length > 0
        ? {
            responses: intakeQuestions.map(q => ({
              question_id: q.id,
              response_text: responses[q.id].trim(),
            })),
          }
        : undefined;

      await GroupService.joinGroup(group.id, request);
      
      success(
        group.requires_approval ? 'Request Submitted' : 'Joined Group',
        group.requires_approval
          ? `Your request to join ${group.name} has been submitted and is pending approval.`
          : `You've successfully joined ${group.name}!`
      );
      
      // Reset form
      setResponses({});
      onClose();
      onJoinSuccess();
    } catch (err) {
      showError('Failed to Join', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleClose = () => {
    if (isJoining) return;
    setResponses({});
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b-2 border-gray-200 flex-shrink-0">
            {/* Group Logo/Emoji */}
            <div className="flex-shrink-0 w-16 h-16 bg-gold-100 rounded-lg flex items-center justify-center overflow-hidden">
              {group.logo_image_url ? (
                <img
                  src={group.logo_image_url}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : group.emoji ? (
                <span className="text-3xl">{group.emoji}</span>
              ) : (
                <UserGroupIcon className="w-8 h-8 text-gold-600" />
              )}
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-2xl font-bold text-black">{group.name}</h2>
                <button
                  onClick={handleClose}
                  disabled={isJoining}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {group.description && (
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4" />
                  {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                </span>
                {group.requires_approval && (
                  <span className="text-amber-600 font-medium">Requires Approval</span>
                )}
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {intakeQuestions.length > 0 ? (
                    <>
                      <div>
                        <h3 className="text-lg font-bold text-black mb-2">Intake Questions</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Please answer the following questions to join this group. All questions are required.
                        </p>
                      </div>

                      {intakeQuestions
                        .sort((a, b) => a.question_order - b.question_order)
                        .map((question) => (
                          <div key={question.id}>
                            <label className="block text-sm font-semibold text-black mb-2">
                              {question.question_text}
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <textarea
                              value={responses[question.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 500) {
                                  handleResponseChange(question.id, value);
                                }
                              }}
                              placeholder="Your answer..."
                              rows={4}
                              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none ${
                                errors[question.id]
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-gray-300 focus:border-gold-500'
                              }`}
                              disabled={isJoining}
                              required
                              maxLength={500}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-red-600">{errors[question.id]}</p>
                              <p className="text-xs text-gray-500">
                                {(responses[question.id] || '').length}/500 characters
                              </p>
                            </div>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserGroupIcon className="w-8 h-8 text-gold-600" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">Ready to join?</h3>
                        <p className="text-gray-600">
                          {group.requires_approval
                            ? 'Your request will be submitted for approval by the group owner.'
                            : 'You\'ll be able to participate in this group immediately.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t-2 border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isJoining}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isJoining || isLoadingQuestions || !isFormValid()}
                className="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining
                  ? 'Joining...'
                  : group.requires_approval
                  ? 'Request to Join'
                  : 'Join Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

