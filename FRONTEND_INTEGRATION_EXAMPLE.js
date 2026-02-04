/**
 * FRONTEND INTEGRATION EXAMPLE
 * 
 * This file shows how to update your frontend to work with the new unified progress system.
 * Copy these patterns into your actual frontend code.
 */

// ============================================================================
// 1. UPDATE API SERVICE
// ============================================================================

// File: src/services/api/progressService.js (or similar)

/**
 * Complete a lesson
 * NEW: Returns nextLessonId for automatic navigation
 */
export const completeLesson = async (lessonId, timeSpent = 0) => {
  const response = await fetch(`${API_URL}/api/progress/lesson/${lessonId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId'), // Your auth method
    },
    body: JSON.stringify({ timeSpent }),
  });

  if (!response.ok) {
    throw new Error('Failed to complete lesson');
  }

  const data = await response.json();
  
  return {
    lessonId: data.lessonId,
    completed: data.completed,
    timeSpent: data.timeSpent,
    nextLessonId: data.nextLessonId,  // ← KEY: Next lesson in sequence
    message: data.message,
  };
};

/**
 * Update lesson progress (during lesson)
 * SIMPLIFIED: Only tracks timeSpent now, not currentStep/totalSteps
 */
export const updateLessonProgress = async (lessonId, { timeSpent = 0, completed = false }) => {
  const response = await fetch(`${API_URL}/api/progress/lesson/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': localStorage.getItem('userId'),
    },
    body: JSON.stringify({
      completed,
      timeSpent,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update progress');
  }

  return response.json();
};

/**
 * Get lesson progress
 */
export const getLessonProgress = async (lessonId) => {
  const response = await fetch(`${API_URL}/api/progress/lesson/${lessonId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId'),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch lesson progress');
  }

  return response.json();
};

/**
 * Get module progress (all lessons in module)
 */
export const getModuleProgress = async (moduleId) => {
  const response = await fetch(`${API_URL}/api/progress/module/${moduleId}`, {
    headers: {
      'x-user-id': localStorage.getItem('userId'),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch module progress');
  }

  return response.json();
};

// ============================================================================
// 2. UPDATE LESSON VIEWER COMPONENT
// ============================================================================

// File: src/components/teaching/LessonViewer.jsx (or similar)

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // or your routing library
import { completeLesson, getLessonProgress } from '@/services/api/progressService';

export const LessonViewer = ({ moduleId, lessonId, lessonContent }) => {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await getLessonProgress(lessonId);
        setIsCompleted(progress.completed);
        setTimeSpent(progress.timeSpent || 0);
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    };

    loadProgress();
  }, [lessonId]);

  // Track time spent (update every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 60); // Add 60 seconds
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Handle lesson completion
   * KEY: Use nextLessonId from response for navigation
   */
  const handleComplete = async () => {
    if (isSubmitting || isCompleted) return;

    setIsSubmitting(true);

    try {
      // Mark lesson as complete
      const response = await completeLesson(lessonId, timeSpent);

      setIsCompleted(true);

      // AUTOMATIC NAVIGATION using nextLessonId
      if (response.nextLessonId) {
        // Navigate to next lesson
        console.log(`✅ Lesson complete! Moving to: ${response.nextLessonId}`);
        router.push(`/teaching/${moduleId}/${response.nextLessonId}`);
      } else {
        // No more lessons - module complete
        console.log('🎉 Module complete!');
        router.push(`/dashboard?moduleComplete=${moduleId}`);
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      alert('Error al completar la lección. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lesson-viewer">
      {/* Lesson content */}
      <div className="lesson-content">
        {lessonContent}
      </div>

      {/* Completion button */}
      <div className="lesson-actions">
        {isCompleted ? (
          <p className="completed-message">
            ✅ Lección completada
          </p>
        ) : (
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="btn-complete"
          >
            {isSubmitting ? 'Guardando...' : 'Completar Lección'}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. ALTERNATIVE: AUTO-COMPLETE ON SCROLL (OPTIONAL)
// ============================================================================

/**
 * If you want to auto-complete when user scrolls to bottom
 */
export const AutoCompleteLessonViewer = ({ moduleId, lessonId, lessonContent }) => {
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      setScrollProgress(scrollPercent);

      // Auto-complete when scrolled to 95%
      if (scrollPercent >= 95 && !isCompleted) {
        handleAutoComplete();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCompleted]);

  const handleAutoComplete = async () => {
    try {
      const response = await completeLesson(lessonId, 0);

      setIsCompleted(true);

      // Small delay before navigation
      setTimeout(() => {
        if (response.nextLessonId) {
          router.push(`/teaching/${moduleId}/${response.nextLessonId}`);
        }
      }, 1500); // 1.5 second delay
    } catch (error) {
      console.error('Failed to auto-complete:', error);
    }
  };

  return (
    <div className="lesson-viewer">
      {/* Progress indicator */}
      <div className="scroll-progress">
        <div
          className="progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Lesson content */}
      <div className="lesson-content">
        {lessonContent}
      </div>

      {isCompleted && (
        <div className="completion-overlay">
          <p>✅ Lección completada</p>
          <p>Cargando siguiente lección...</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. UPDATE MODULE OVERVIEW (SHOW PROGRESS)
// ============================================================================

// File: src/components/teaching/ModuleOverview.jsx

import { getModuleProgress } from '@/services/api/progressService';

export const ModuleOverview = ({ moduleId }) => {
  const [moduleData, setModuleData] = useState(null);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await getModuleProgress(moduleId);
        setModuleData(data);
      } catch (error) {
        console.error('Failed to load module progress:', error);
      }
    };

    loadProgress();
  }, [moduleId]);

  if (!moduleData) return <div>Cargando...</div>;

  return (
    <div className="module-overview">
      <h2>Progreso del Módulo</h2>
      
      {/* Overall progress */}
      <div className="progress-summary">
        <p>
          {moduleData.completedLessons} / {moduleData.totalLessons} lecciones completadas
        </p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${moduleData.completionPercentage}%` }}
          />
        </div>
        <p>{moduleData.completionPercentage}% completo</p>
      </div>

      {/* Lesson list with completion status */}
      <ul className="lesson-list">
        {moduleData.lessons.map((lesson) => (
          <li
            key={lesson.lessonId}
            className={lesson.completed ? 'completed' : 'pending'}
          >
            <span className="lesson-status">
              {lesson.completed ? '✅' : '⏳'}
            </span>
            <span className="lesson-name">{lesson.lessonId}</span>
            {lesson.completed && (
              <span className="lesson-time">
                {Math.floor(lesson.timeSpent / 60)} min
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ============================================================================
// 5. MIGRATION HELPER (IF NEEDED)
// ============================================================================

/**
 * If you have old frontend code tracking currentStep/totalSteps,
 * you can keep that in LOCAL STATE only, and only send completed status to backend.
 */
export const LegacyCompatibleViewer = ({ moduleId, lessonId, sections }) => {
  const [currentStep, setCurrentStep] = useState(0); // Local state only
  const [timeSpent, setTimeSpent] = useState(0);
  const router = useRouter();

  const totalSteps = sections.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Complete lesson
      handleComplete();
    } else {
      // Just move to next step (local only)
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await completeLesson(lessonId, timeSpent);

      if (response.nextLessonId) {
        router.push(`/teaching/${moduleId}/${response.nextLessonId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  return (
    <div>
      {/* Show current section */}
      <div className="section-content">
        {sections[currentStep]}
      </div>

      {/* Navigation */}
      <div className="section-navigation">
        <p>
          Paso {currentStep + 1} de {totalSteps}
        </p>
        <button onClick={handleNext}>
          {isLastStep ? 'Completar Lección' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 6. KEY CHANGES SUMMARY
// ============================================================================

/**
 * WHAT CHANGED:
 * 
 * OLD SYSTEM:
 * - Frontend tracked: currentStep, totalSteps, completionPercentage
 * - Backend saved all these fields
 * - Frontend decided which lesson was "next"
 * 
 * NEW SYSTEM:
 * - Frontend tracks: only UI state (what card user is on)
 * - Backend tracks: completed (boolean), timeSpent (number)
 * - Backend decides which lesson is "next" and returns nextLessonId
 * 
 * MIGRATION PATH:
 * 1. Keep step tracking in frontend state (don't send to backend)
 * 2. Only send completed=true when user finishes lesson
 * 3. Use nextLessonId from response for navigation
 * 
 * BENEFITS:
 * - Single source of truth (backend)
 * - No more sync issues
 * - Automatic navigation
 * - Simpler frontend logic
 */
