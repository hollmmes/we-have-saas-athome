import { createIcons, Home, Info, CheckCircle, Download, Menu, Image, Archive, Trash2, FolderOpen, Settings, Video, Plus, Play, Hash, Maximize, Monitor, Crop, Database, HardDrive, Table, RefreshCw, Folder } from 'lucide';

const allIcons = {
  Home,
  Info,
  CheckCircle,
  Download,
  Menu,
  Image,
  Archive,
  Trash2,
  FolderOpen,
  Settings,
  Video,
  Plus,
  Play,
  Hash,
  Maximize,
  Monitor,
  Crop,
  Database,
  HardDrive,
  Table,
  RefreshCw,
  Folder
};

export function initIcons() {
  createIcons({
    icons: allIcons,
    attrs: {
      width: '20',
      height: '20',
      'stroke-width': '2'
    }
  });
}

// Make createIcons global for dynamic icon creation
(window as any).createIcons = () => {
  initIcons();
};
