// Presentational component library (UX-01 "Componentes"). Props in, callbacks out: no imports
// from features/ or core/. Adding a component = new file + export here.
export { AllergenScopeBanner, type AllergenScopeBannerProps } from './allergen/AllergenScopeBanner';
export { AllergenSeal, type AllergenSealProps } from './allergen/AllergenSeal';
export { AllergenTag } from './allergen/AllergenTag';
export { FailClosedAlert, type FailClosedAlertProps } from './allergen/FailClosedAlert';
export {
  ALLERGEN_GROUPS,
  ALLERGEN_LABELS,
  allergenLabel,
  type AllergenGroup,
} from './allergen/labels';
export { BadgeIcon, type BadgeIconProps } from './BadgeIcon';
export { BottomSheet, type BottomSheetProps } from './BottomSheet';
export { Button, type ButtonProps, type ButtonVariant } from './Button';
export { Chip, type ChipProps } from './Chip';
export { DishThumb, type DishThumbProps } from './DishThumb';
export { FieldLabel, type FieldLabelProps } from './FieldLabel';
export { IconButton, type IconButtonProps } from './IconButton';
export { Icon, type IconProps } from './icons/Icon';
export { ICONS, type IconName } from './icons/registry';
export { IngredientRow, type IngredientRowProps } from './IngredientRow';
export { LastSync, type LastSyncProps } from './LastSync';
export { LoadingScreen } from './LoadingScreen';
export { MOTION_DURATION_MS, useReducedMotion } from './motion';
export { Notice, type NoticeProps, type NoticeType } from './Notice';
export { OfflineBar, type OfflineBarProps } from './OfflineBar';
export { Pill, type PillProps, type PillType } from './Pill';
export { PlaceholderScreen, type PlaceholderScreenProps } from './PlaceholderScreen';
export { ProgressBar, type ProgressBarProps } from './ProgressBar';
export { SearchField, type SearchFieldProps } from './SearchField';
export {
  SegmentedControl,
  type SegmentOption,
  type SegmentedControlProps,
} from './SegmentedControl';
export { Star, type StarFill, type StarProps } from './Star';
export { EmptyState, type EmptyStateProps } from './state/EmptyState';
export { Skeleton, type SkeletonProps } from './state/Skeleton';
export { StepItem, type StepItemProps, type StepState } from './StepItem';
export { Stepper, type StepperProps } from './Stepper';
export { SwapButton, type SwapButtonProps } from './SwapButton';
export { TabBar, type TabBarItem, type TabBarProps } from './TabBar';
export { TextLink, type TextLinkProps, type TextLinkTone } from './TextLink';
export { Toast, type ToastProps } from './Toast';
export { Topbar, type TopbarProps } from './Topbar';
