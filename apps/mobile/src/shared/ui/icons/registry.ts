import type { FC } from 'react';
import type { SvgProps } from 'react-native-svg';
import AlertCircleSvg from '../../assets/icons/alert-circle.svg';
import BackSvg from '../../assets/icons/back.svg';
import BadgeSvg from '../../assets/icons/badge.svg';
import CheckSvg from '../../assets/icons/check.svg';
import CloseSvg from '../../assets/icons/close.svg';
import DishPlaceholderSvg from '../../assets/icons/dish-placeholder.svg';
import DownloadSvg from '../../assets/icons/download.svg';
import HalfCircleSvg from '../../assets/icons/half-circle.svg';
import InfoSvg from '../../assets/icons/info.svg';
import LockSvg from '../../assets/icons/lock.svg';
import MinusSvg from '../../assets/icons/minus.svg';
import OfflineSvg from '../../assets/icons/offline.svg';
import PlusSvg from '../../assets/icons/plus.svg';
import QuestionSvg from '../../assets/icons/question.svg';
import RetrySvg from '../../assets/icons/retry.svg';
import SearchSvg from '../../assets/icons/search.svg';
import StarSvg from '../../assets/icons/star.svg';
import SwapSvg from '../../assets/icons/swap.svg';
import TabCollectionSvg from '../../assets/icons/tab-collection.svg';
import TabDiscoverSvg from '../../assets/icons/tab-discover.svg';
import TabKitchenSvg from '../../assets/icons/tab-kitchen.svg';
import TabProfileSvg from '../../assets/icons/tab-profile.svg';
import WarningSvg from '../../assets/icons/warning.svg';

// Adding an icon = drop a 24×24 `currentColor` SVG in shared/assets/icons and register it here.
export const ICONS = {
  'alert-circle': AlertCircleSvg,
  back: BackSvg,
  badge: BadgeSvg,
  check: CheckSvg,
  close: CloseSvg,
  'dish-placeholder': DishPlaceholderSvg,
  download: DownloadSvg,
  'half-circle': HalfCircleSvg,
  info: InfoSvg,
  lock: LockSvg,
  minus: MinusSvg,
  offline: OfflineSvg,
  plus: PlusSvg,
  question: QuestionSvg,
  retry: RetrySvg,
  search: SearchSvg,
  star: StarSvg,
  swap: SwapSvg,
  'tab-collection': TabCollectionSvg,
  'tab-discover': TabDiscoverSvg,
  'tab-kitchen': TabKitchenSvg,
  'tab-profile': TabProfileSvg,
  warning: WarningSvg,
} as const satisfies Record<string, FC<SvgProps>>;

export type IconName = keyof typeof ICONS;
