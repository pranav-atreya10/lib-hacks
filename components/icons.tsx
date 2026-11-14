import type { ComponentProps } from "react";
import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  ArrowLeftIcon as PArrowLeft,
  ArrowRightIcon as PArrowRight,
  ArrowUpRightIcon as PArrowUpRight,
  BookOpenIcon as PBookOpen,
  BooksIcon as PBooks,
  BuildingsIcon as PBuildings,
  CaretDownIcon as PCaretDown,
  CaretRightIcon as PCaretRight,
  CaretUpDownIcon as PCaretUpDown,
  ChatCircleIcon as PChatCircle,
  CheckCircleIcon as PCheckCircle,
  CheckIcon as PCheck,
  CircleNotchIcon as PCircleNotch,
  CompassIcon as PCompass,
  EyeIcon as PEye,
  FileTextIcon as PFileText,
  FolderIcon as PFolder,
  HeartIcon as PHeart,
  ImageIcon as PImage,
  LockSimpleIcon as PLock,
  MagnifyingGlassIcon as PSearch,
  MicrophoneIcon as PMic,
  MonitorIcon as PMonitor,
  MoonIcon as PMoon,
  PlayIcon as PPlay,
  PlusIcon as PPlus,
  SparkleIcon as PSparkle,
  StackIcon as PStack,
  StarIcon as PStar,
  SunIcon as PSun,
  TagIcon as PTag,
  TrashIcon as PTrash,
  TrendUpIcon as PTrendUp,
  UsersThreeIcon as PUsers,
  XIcon as PX,
} from "@phosphor-icons/react/dist/ssr";

/**
 * One icon family for the whole app: Phosphor, bold weight, so every glyph
 * shares the same stroke. A `fill-*` class (a liked heart, a rated star)
 * switches that icon to its filled weight.
 */
function make(Base: Icon) {
  function AppIcon({ weight, className, ...props }: IconProps & ComponentProps<"svg">) {
    const filled = typeof className === "string" && /(^|\s)fill-/.test(className);
    return <Base weight={weight ?? (filled ? "fill" : "bold")} className={className} {...props} />;
  }
  return AppIcon;
}

export const ArrowLeftIcon = make(PArrowLeft);
export const ArrowRightIcon = make(PArrowRight);
export const ArrowUpRightIcon = make(PArrowUpRight);
export const BookOpenIcon = make(PBookOpen);
export const BooksIcon = make(PBooks);
export const BuildingsIcon = make(PBuildings);
export const CheckCircle2Icon = make(PCheckCircle);
export const CheckIcon = make(PCheck);
export const ChevronDownIcon = make(PCaretDown);
export const ChevronRightIcon = make(PCaretRight);
export const ChevronsUpDownIcon = make(PCaretUpDown);
export const CompassIcon = make(PCompass);
export const EyeIcon = make(PEye);
export const FileTextIcon = make(PFileText);
export const FolderIcon = make(PFolder);
export const HeartIcon = make(PHeart);
export const ImageIcon = make(PImage);
export const LayersIcon = make(PStack);
export const LoaderIcon = make(PCircleNotch);
export const LockIcon = make(PLock);
export const MessageSquareIcon = make(PChatCircle);
export const MicIcon = make(PMic);
export const MonitorIcon = make(PMonitor);
export const MoonIcon = make(PMoon);
export const PlayIcon = make(PPlay);
export const PlusIcon = make(PPlus);
export const SearchIcon = make(PSearch);
export const SparklesIcon = make(PSparkle);
export const StarIcon = make(PStar);
export const SunIcon = make(PSun);
export const TagIcon = make(PTag);
export const TrashIcon = make(PTrash);
export const TrendingUpIcon = make(PTrendUp);
export const UsersIcon = make(PUsers);
export const XIcon = make(PX);
