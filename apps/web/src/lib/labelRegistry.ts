import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@gym-monorepo/shared';

export const LABEL_REGISTRY = {
  tenantSettings: {
    name: 'labels.tenantSettings.name',
    slug: 'labels.tenantSettings.slug',
    type: 'labels.tenantSettings.type',
    language: 'labels.tenantSettings.language',
    taxable: 'labels.tenantSettings.taxable',
    taxSelection: 'labels.tenantSettings.taxSelection',
    taxHint: 'labels.tenantSettings.taxHint',
    theme: 'labels.tenantSettings.theme',
  },
  tenants: {
    name: 'labels.tenants.name',
    slug: 'labels.tenants.slug',
    status: 'labels.tenants.status',
    language: 'labels.tenants.language',
    actions: 'labels.tenants.actions',
  },
} as const;

export const LANGUAGE_SELECT_OPTIONS = SUPPORTED_LOCALES.map((locale) => ({
  value: locale,
  label: LOCALE_LABELS[locale] || locale,
}));

type LanguageOption = (typeof LANGUAGE_SELECT_OPTIONS)[number];

export type LanguageSelectValue = LanguageOption['value'];

export type LabelRegistry = typeof LABEL_REGISTRY;
