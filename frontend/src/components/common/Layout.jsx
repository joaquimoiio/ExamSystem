import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Home, BookOpen, FileText, BarChart3, Settings, 
  User, LogOut, Bell, Search, Moon, Sun, Wifi, WifiOff,
  ChevronDown, Plus, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '../../contexts/ToastContext';

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/subjects', icon: BookOpen, label: 'Disciplinas' },
    { path: '/questions', icon: FileText, label: 'Questões' },
    { path: '/exams', icon: BarChart3, label: 'Provas' },
    { path: '/exam-headers', icon: FileText, label: 'Cabeçalhos' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">ExamSystem</h1>
                <p className="text-xs text-gray-500">Sistema de Provas</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-100 p-2 rounded-full">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive(item.path) 
                      ? 'bg-primary-100 text-primary-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-gray-500 text-center">
              v1.0.0 • Sistema de Provas
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Header({ onMenuClick }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { offline, theme, setTheme } = useApp();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    success('Logout realizado com sucesso!');
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Network status */}
        <div className="flex items-center">
          {offline ? (
            <div className="flex items-center text-red-600">
              <WifiOff className="w-4 h-4 mr-1" />
              <span className="text-xs hidden sm:inline">Offline</span>
            </div>
          ) : (
            <div className="flex items-center text-green-600">
              <Wifi className="w-4 h-4 mr-1" />
              <span className="text-xs hidden sm:inline">Online</span>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notificações</h3>
              </div>
              <div className="p-4 text-sm text-gray-500 text-center">
                Nenhuma notificação nova
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="bg-primary-100 p-1 rounded-full">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
              <div className="p-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Perfil</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Configurações</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Show help modal or navigate to help
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg w-full text-left"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Ajuda</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg w-full text-left text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handlers */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileMenu(false)} 
        />
      )}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)} 
        />
      )}
    </header>
  );
}

function FloatingActionButton({ children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40"
      {...props}
    >
      {children}
    </button>
  );
}

export default function Layout({ children, showFab = false, fabAction, fabIcon: FabIcon = Plus }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return children; // Don't wrap with layout if not authenticated
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {showFab && fabAction && (
        <FloatingActionButton onClick={fabAction}>
          <FabIcon className="w-6 h-6" />
        </FloatingActionButton>
      )}
    </div>
  );
}