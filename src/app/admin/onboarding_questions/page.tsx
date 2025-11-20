'use client';

import { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { OnboardingQuestion } from '@/features/onboarding/services/onboardingService';
import { ProfileType } from '@/features/auth';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  homeowner: 'Homeowner',
  renter: 'Renter',
  investor: 'Investor',
  realtor: 'Realtor',
  wholesaler: 'Wholesaler',
  contractor: 'Contractor',
  services: 'Services',
  developer: 'Developer',
  property_manager: 'Property Manager',
  organization: 'Organization',
};

const FIELD_TYPE_LABELS: Record<OnboardingQuestion['field_type'], string> = {
  text: 'Text',
  textarea: 'Textarea',
  number: 'Number',
  currency: 'Currency',
  select: 'Select (Single)',
  multiselect: 'Multiselect',
  boolean: 'Boolean',
  map_point: 'Map Point (Drop a Pin)',
  map_area: 'Map Area (Polygon or Radius)',
  address: 'Address',
  range: 'Range (Min/Max)',
};

// Options Input Component for Select Fields
function OptionsInput({ value, onChange, fieldType }: { value: string; onChange: (value: string) => void; fieldType: 'select' | 'multiselect' }) {
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.values && Array.isArray(parsed.values)) {
          setOptions(parsed.values);
        }
      } catch {
        // Invalid JSON, start fresh
        setOptions([]);
      }
    } else {
      setOptions([]);
    }
  }, [value]);

  const addOption = () => {
    if (newOption.trim()) {
      const updated = [...options, newOption.trim()];
      setOptions(updated);
      onChange(JSON.stringify({ values: updated }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    onChange(JSON.stringify({ values: updated }));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="Add option..."
        />
        <button
          type="button"
          onClick={addOption}
          className="px-3 py-1.5 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
        >
          Add
        </button>
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
            >
              {opt}
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="text-gray-500 hover:text-red-600"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Range Input Component
function RangeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [step, setStep] = useState('1');

  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setMin(parsed.min?.toString() || '');
        setMax(parsed.max?.toString() || '');
        setStep(parsed.step?.toString() || '1');
      } catch {
        // Invalid JSON, start fresh
      }
    }
  }, [value]);

  useEffect(() => {
    // Only update if we have at least min or max
    if (min || max) {
      const rangeObj: any = {};
      if (min) rangeObj.min = parseInt(min, 10);
      if (max) rangeObj.max = parseInt(max, 10);
      if (step) rangeObj.step = parseInt(step, 10) || 1;
      onChange(JSON.stringify(rangeObj));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, step]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Min</label>
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="1"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Max</label>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="5"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Step</label>
        <input
          type="number"
          value={step}
          onChange={(e) => setStep(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          placeholder="1"
          min="1"
        />
      </div>
    </div>
  );
}

interface QuestionFormData {
  profile_type: ProfileType;
  key: string;
  label: string;
  description: string;
  field_type: OnboardingQuestion['field_type'];
  options: string;
  required: boolean;
  active: boolean;
  sort_order: number;
}

export default function OnboardingQuestionsAdminPage() {
  const [questions, setQuestions] = useState<Record<ProfileType, OnboardingQuestion[]>>({
    homeowner: [],
    renter: [],
    investor: [],
    realtor: [],
    wholesaler: [],
    contractor: [],
    services: [],
    developer: [],
    property_manager: [],
    organization: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<OnboardingQuestion | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    profile_type: 'homeowner',
    key: '',
    label: '',
    description: '',
      field_type: 'text',
    options: '',
    required: true,
    active: true,
    sort_order: 100,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/onboarding-questions');
      
      if (!response.ok) {
        if (response.status === 403) {
          window.location.href = '/login?redirect=/admin/onboarding_questions&message=Please sign in to access admin panel';
          return;
        }
        
        // Try to get error message from response
        let errorMessage = 'Failed to load questions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Failed to load questions (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setQuestions(data);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = (profileType: ProfileType) => {
    const maxSortOrder = Math.max(
      ...questions[profileType].map(q => q.sort_order),
      0
    );
    setFormData({
      profile_type: profileType,
      key: '',
      label: '',
      description: '',
      field_type: 'text',
      options: '',
      required: true,
      active: true,
      sort_order: maxSortOrder + 10,
    });
    setSelectedProfileType(profileType);
    setIsCreating(true);
    setEditingQuestion(null);
  };

  const openEditModal = (question: OnboardingQuestion) => {
    setFormData({
      profile_type: question.profile_type,
      key: question.key,
      label: question.label,
      description: question.description || '',
      field_type: question.field_type,
      options: question.options ? JSON.stringify(question.options, null, 2) : '',
      required: question.required,
      active: question.active ?? true,
      sort_order: question.sort_order,
    });
    setSelectedProfileType(question.profile_type);
    setIsCreating(false);
    setEditingQuestion(question);
  };

  const closeModal = () => {
    setIsCreating(false);
    setEditingQuestion(null);
    setSelectedProfileType(null);
    setFormData({
      profile_type: 'homeowner',
      key: '',
      label: '',
      description: '',
      field_type: 'text',
      options: '',
      required: true,
      active: true,
      sort_order: 100,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);

      // Parse options JSON if provided
      let parsedOptions: any = null;
      if (formData.options.trim()) {
        try {
          parsedOptions = JSON.parse(formData.options);
        } catch {
          throw new Error('Invalid JSON in options field');
        }
      }

      const payload = {
        ...formData,
        description: formData.description || null,
        options: parsedOptions,
        active: formData.active,
      };

      let response: Response;
      if (isCreating) {
        response = await fetch('/api/admin/onboarding-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else if (editingQuestion) {
        response = await fetch(`/api/admin/onboarding-questions/${editingQuestion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      await loadQuestions();
      closeModal();
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(questionId);
      setError(null);

      const response = await fetch(`/api/admin/onboarding-questions/${questionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete question');
      }

      await loadQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleActive = async (questionId: number, currentActive: boolean) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/onboarding-questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle active status');
      }

      await loadQuestions();
    } catch (err) {
      console.error('Error toggling active status:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle active status');
    }
  };

  const moveQuestion = async (questionId: number, direction: 'up' | 'down', profileType: ProfileType) => {
    const profileQuestions = [...questions[profileType]].sort((a, b) => a.sort_order - b.sort_order);
    const index = profileQuestions.findIndex(q => q.id === questionId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === profileQuestions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updates = [
      { id: questionId, sort_order: profileQuestions[newIndex].sort_order },
      { id: profileQuestions[newIndex].id, sort_order: profileQuestions[index].sort_order },
    ];

    try {
      setError(null);
      const response = await fetch('/api/admin/onboarding-questions/sort', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder questions');
      }

      await loadQuestions();
    } catch (err) {
      console.error('Error reordering questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to reorder questions');
    }
  };

  return (
    <PageLayout
      showHeader={true}
      showFooter={false}
      containerMaxWidth="full"
      backgroundColor="bg-gold-100"
      contentPadding=""
    >
      <div className="min-h-screen bg-gold-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <DocumentTextIcon className="w-8 h-8 text-gold-600" />
              <h1 className="text-4xl sm:text-5xl font-bold text-black">
                Onboarding Questions
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Manage onboarding questions for all account types
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="text-gray-600">Loading questions...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {(Object.keys(questions) as ProfileType[]).map((profileType) => {
                const profileQuestions = questions[profileType].sort((a, b) => a.sort_order - b.sort_order);
                
                return (
                  <div key={profileType} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-black">
                          {PROFILE_TYPE_LABELS[profileType]}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {profileQuestions.length} question{profileQuestions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => openCreateModal(profileType)}
                        className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add Question
                      </button>
                    </div>

                    {profileQuestions.length === 0 ? (
                      <div className="p-6 text-center text-gray-600">
                        No questions yet. Click "Add Question" to create one.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {profileQuestions.map((question, index) => (
                          <div
                            key={question.id}
                            className="p-6 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col gap-1 pt-1">
                                <button
                                  onClick={() => moveQuestion(question.id, 'up', profileType)}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move up"
                                >
                                  <ChevronUpIcon className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => moveQuestion(question.id, 'down', profileType)}
                                  disabled={index === profileQuestions.length - 1}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move down"
                                >
                                  <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg font-semibold text-black">
                                        {question.label}
                                      </h3>
                                      {question.active === false && (
                                        <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                          Inactive
                                        </span>
                                      )}
                                      {question.required && (
                                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                          Required
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                        {FIELD_TYPE_LABELS[question.field_type]}
                                      </span>
                                    </div>
                                    {question.description && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        {question.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>
                                        Key: <code className="bg-gray-100 px-1 rounded">{question.key}</code>
                                      </span>
                                      <span>Sort: {question.sort_order}</span>
                                    </div>
                                    {question.options && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        <span className="font-medium">Options: </span>
                                        <code className="bg-gray-100 px-1 rounded">
                                          {JSON.stringify(question.options)}
                                        </code>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleActive(question.id, question.active ?? true)}
                                      className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                                        question.active === false
                                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                                      }`}
                                      title={question.active === false ? 'Click to activate' : 'Click to deactivate'}
                                    >
                                      {question.active === false ? 'Inactive' : 'Active'}
                                    </button>
                                    <button
                                      onClick={() => openEditModal(question)}
                                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <PencilIcon className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(question.id)}
                                      disabled={isDeleting === question.id}
                                      className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                      title="Delete"
                                    >
                                      {isDeleting === question.id ? (
                                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <TrashIcon className="w-5 h-5 text-red-600" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Create/Edit Modal */}
          {(isCreating || editingQuestion) && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={closeModal}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[60vh] overflow-y-auto pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-black">
                      {isCreating ? 'Create Question' : 'Edit Question'}
                    </h2>
                    <button
                      onClick={closeModal}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Profile Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.profile_type}
                          onChange={(e) => setFormData({ ...formData, profile_type: e.target.value as ProfileType })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                          required
                        >
                          {(Object.keys(PROFILE_TYPE_LABELS) as ProfileType[]).map((type) => (
                            <option key={type} value={type}>
                              {PROFILE_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Field Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.field_type}
                          onChange={(e) => setFormData({ ...formData, field_type: e.target.value as OnboardingQuestion['field_type'], options: '' })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                          required
                        >
                          {(Object.keys(FIELD_TYPE_LABELS) as OnboardingQuestion['field_type'][]).map((type) => (
                            <option key={type} value={type}>
                              {FIELD_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.key}
                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        placeholder="e.g., property_address"
                        required
                        disabled={!isCreating}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        placeholder="e.g., What property are you dealing with?"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                        placeholder="Optional helper text"
                        rows={2}
                      />
                    </div>

                    {/* Dynamic Options Input Based on Field Type */}
                    {(formData.field_type === 'select' || formData.field_type === 'multiselect') && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <OptionsInput
                          value={formData.options}
                          onChange={(value) => setFormData({ ...formData, options: value })}
                          fieldType={formData.field_type}
                        />
                      </div>
                    )}

                    {formData.field_type === 'range' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Range Settings <span className="text-red-500">*</span>
                        </label>
                        <RangeInput
                          value={formData.options}
                          onChange={(value) => setFormData({ ...formData, options: value })}
                        />
                      </div>
                    )}


                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="required"
                          checked={formData.required}
                          onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                        />
                        <label htmlFor="required" className="text-xs font-medium text-gray-700">
                          Required
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="active"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                        />
                        <label htmlFor="active" className="text-xs font-medium text-gray-700">
                          Active
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-3 py-2 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : isCreating ? 'Create' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Back Link */}
          <div className="mt-8">
            <a
              href="/admin"
              className="text-gold-600 hover:text-gold-700 font-medium text-sm"
            >
              ← Back to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

