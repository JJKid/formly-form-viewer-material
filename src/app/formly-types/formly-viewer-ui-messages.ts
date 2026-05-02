export type FormlyViewerUiLocale = string;

export interface FormlyViewerStepperUiMessages {
  welcomeTitle: string;
  completionSavedTitle: string;
  completionPreviewTitle: string;
  completionScreenoutTitle: string;
  stepLabel: string;
  stepOfLabel: string;
  startLabel: string;
  previousLabel: string;
  nextLabel: string;
  submitLabel: string;
  backLabel: string;
  warningCodes: Record<string, string>;
  didNotSaveCodes: Record<string, string>;
  pendingValidationHintMissing: string;
  pendingValidationHintInvalid: string;
}

export interface FormlyViewerUiMessagesDictionary {
  submitLabel: string;
  checkboxWithText: {
    commentPlaceholder: string;
  };
  stepper: FormlyViewerStepperUiMessages;
}

export const DEFAULT_FORMLY_VIEWER_UI_DICTIONARIES: Record<FormlyViewerUiLocale, FormlyViewerUiMessagesDictionary> = {
  en: {
    submitLabel: 'Submit',
    checkboxWithText: {
      commentPlaceholder: 'Comment',
    },
    stepper: {
      welcomeTitle: 'Welcome',
      completionSavedTitle: 'Thank you for participating',
      completionPreviewTitle: 'Not saved',
      completionScreenoutTitle: 'Survey completed',
      stepLabel: 'Step',
      stepOfLabel: 'of',
      startLabel: 'Start',
      previousLabel: 'Previous',
      nextLabel: 'Next',
      submitLabel: 'Submit',
      backLabel: 'Back',
      warningCodes: {
        SURVEY_NOT_ACTIVE_PREVIEW: 'This survey is currently not active. Responses cannot be saved.',
      },
      didNotSaveCodes: {
        SURVEY_NOT_ACTIVE_NOT_RECORDED: 'Your responses were not recorded because this survey is not active.',
      },
      pendingValidationHintMissing: '{count} required answers are still missing in this section.',
      pendingValidationHintInvalid: 'There are {count} invalid or incomplete answers in this section.',
    },
  },
  es: {
    submitLabel: 'Enviar',
    checkboxWithText: {
      commentPlaceholder: 'Comentario',
    },
    stepper: {
      welcomeTitle: 'Bienvenida',
      completionSavedTitle: 'Gracias por participar',
      completionPreviewTitle: 'No se guardó',
      completionScreenoutTitle: 'Encuesta finalizada',
      stepLabel: 'Paso',
      stepOfLabel: 'de',
      startLabel: 'Comenzar',
      previousLabel: 'Anterior',
      nextLabel: 'Siguiente',
      submitLabel: 'Enviar',
      backLabel: 'Regresar',
      warningCodes: {
        SURVEY_NOT_ACTIVE_PREVIEW: 'Esta encuesta no está activa. No será posible guardar respuestas.',
      },
      didNotSaveCodes: {
        SURVEY_NOT_ACTIVE_NOT_RECORDED: 'Tus respuestas no fueron registradas porque la encuesta no está activa.',
      },
      pendingValidationHintMissing: 'Faltan {count} respuestas obligatorias en esta sección.',
      pendingValidationHintInvalid: 'Hay {count} respuestas inválidas o incompletas en esta sección.',
    },
  },
};

export function normalizeViewerUiLocale(localeCandidate: unknown, fallback: FormlyViewerUiLocale = 'en'): FormlyViewerUiLocale {
  const normalized = `${localeCandidate ?? ''}`.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized.startsWith('es')) {
    return 'es';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }
  return normalized;
}

