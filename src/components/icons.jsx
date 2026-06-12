// All icons come from a single source (lucide-react) with one stroke width,
// so the whole app reads as one consistent set.
import {
  Users,
  CheckCircle2,
  Check,
  Clock,
  AlertCircle,
  IndianRupee,
  Search,
  Plus,
  LayoutDashboard,
  User,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Mail,
  Lock,
  Phone,
  Calendar,
  RefreshCw,
  Pencil,
  Trash2,
  Send,
  Sparkles,
  ArrowRight,
  Dumbbell,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  Banknote,
  Smartphone,
  Wallet,
  TrendingUp,
  SwitchCamera,
  RotateCcw,
  Download,
} from 'lucide-react';

const STROKE = 1.75;

const wrap = (Icon) =>
  function WrappedIcon({ size = 20, strokeWidth = STROKE, ...rest }) {
    return <Icon size={size} strokeWidth={strokeWidth} {...rest} />;
  };

export const IconUsers = wrap(Users);
export const IconCheck = wrap(CheckCircle2);
export const IconCheckMark = wrap(Check);
export const IconClock = wrap(Clock);
export const IconAlert = wrap(AlertCircle);
export const IconRupee = wrap(IndianRupee);
export const IconSearch = wrap(Search);
export const IconPlus = wrap(Plus);
export const IconHome = wrap(LayoutDashboard);
export const IconList = wrap(Users);
export const IconUser = wrap(User);
export const IconChevronLeft = wrap(ChevronLeft);
export const IconChevronRight = wrap(ChevronRight);
export const IconBell = wrap(Bell);
export const IconLogout = wrap(LogOut);
export const IconMail = wrap(Mail);
export const IconLock = wrap(Lock);
export const IconPhone = wrap(Phone);
export const IconCalendar = wrap(Calendar);
export const IconRefresh = wrap(RefreshCw);
export const IconEdit = wrap(Pencil);
export const IconTrash = wrap(Trash2);
export const IconSend = wrap(Send);
export const IconSparkle = wrap(Sparkles);
export const IconArrowRight = wrap(ArrowRight);
export const IconDumbbell = wrap(Dumbbell);
export const IconCamera = wrap(Camera);
export const IconImage = wrap(ImageIcon);
export const IconX = wrap(X);
export const IconSpinner = wrap(Loader2);
export const IconCash = wrap(Banknote);
export const IconSmartphone = wrap(Smartphone);
export const IconWallet = wrap(Wallet);
export const IconTrend = wrap(TrendingUp);
export const IconCameraFlip = wrap(SwitchCamera);
export const IconRetake = wrap(RotateCcw);
export const IconDownload = wrap(Download);
