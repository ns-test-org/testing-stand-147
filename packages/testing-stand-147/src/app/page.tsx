'use client';

import { useState, useEffect } from 'react';

type Priority = 'low' | 'medium' | 'high';
type Category = 'personal' | 'work' | 'shopping' | 'health' | 'other';
type FilterType = 'all' | 'active' | 'completed';
type SortType = 'date' | 'priority' | 'alphabetical' | 'dueDate';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  createdAt: Date;
  notes: string;
}

const priorityColors = {
  low: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-red-100 text-red-700 border-red-300',
};

const categoryIcons: Record<Category, string> = {
  personal: '👤',
  work: '💼',
  shopping: '🛒',
  health: '❤️',
  other: '📌',
};

const categoryColors: Record<Category, string> = {
  personal: 'bg-blue-100 text-blue-700',
  work: 'bg-purple-100 text-purple-700',
  shopping: 'bg-orange-100 text-orange-700',
  health: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('personal');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('complexTodos');
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('complexTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const addTodo = () => {
    if (inputValue.trim() === '') return;

    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
      priority,
      category,
      dueDate: dueDate || null,
      createdAt: new Date(),
      notes,
    };

    setTodos([newTodo, ...todos]);
    setInputValue('');
    setDueDate('');
    setNotes('');
    setPriority('medium');
    setCategory('personal');
    setShowAddForm(false);
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = (id: number) => {
    if (editText.trim() === '') return;
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, text: editText } : todo
      )
    );
    setEditingId(null);
    setEditText('');
  };

  const updatePriority = (id: number, newPriority: Priority) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, priority: newPriority } : todo
      )
    );
  };

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  // Filter and sort todos
  const filteredTodos = todos
    .filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter((todo) => {
      if (categoryFilter !== 'all') return todo.category === categoryFilter;
      return true;
    })
    .filter((todo) =>
      todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'alphabetical':
          return a.text.localeCompare(b.text);
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
    highPriority: todos.filter((t) => t.priority === 'high' && !t.completed)
      .length,
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
      } p-4 md:p-8`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className={`${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl shadow-2xl p-6 md:p-8 mb-6 transition-colors duration-300`}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1
                className={`text-3xl md:text-4xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}
              >
                ✨ Task Master v2
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Organize your life, one task at a time
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full ${
                darkMode
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-yellow-400'
              } transition-all hover:scale-110`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div
              className={`${
                darkMode ? 'bg-gray-700' : 'bg-indigo-50'
              } rounded-xl p-4 text-center`}
            >
              <div
                className={`text-2xl font-bold ${
                  darkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              >
                {stats.total}
              </div>
              <div
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Total
              </div>
            </div>
            <div
              className={`${
                darkMode ? 'bg-gray-700' : 'bg-blue-50'
              } rounded-xl p-4 text-center`}
            >
              <div
                className={`text-2xl font-bold ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {stats.active}
              </div>
              <div
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Active
              </div>
            </div>
            <div
              className={`${
                darkMode ? 'bg-gray-700' : 'bg-green-50'
              } rounded-xl p-4 text-center`}
            >
              <div
                className={`text-2xl font-bold ${
                  darkMode ? 'text-green-400' : 'text-green-600'
                }`}
              >
                {stats.completed}
              </div>
              <div
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Done
              </div>
            </div>
            <div
              className={`${
                darkMode ? 'bg-gray-700' : 'bg-red-50'
              } rounded-xl p-4 text-center`}
            >
              <div
                className={`text-2xl font-bold ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`}
              >
                {stats.highPriority}
              </div>
              <div
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Urgent
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search tasks..."
              className={`w-full px-4 py-3 rounded-xl ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'
              } border-2 focus:outline-none focus:border-purple-500 transition-colors`}
            />
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              showAddForm
                ? 'bg-gray-300 text-gray-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Task'}
          </button>

          {/* Add Task Form */}
          {showAddForm && (
            <div
              className={`mt-4 p-6 rounded-xl ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              } space-y-4 animate-fadeIn`}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What needs to be done?"
                className={`w-full px-4 py-3 rounded-lg ${
                  darkMode
                    ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-500'
                    : 'bg-white text-gray-800 placeholder-gray-400 border-gray-200'
                } border-2 focus:outline-none focus:border-purple-500`}
                autoFocus
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white text-gray-800 border-gray-200'
                    } border-2 focus:outline-none focus:border-purple-500`}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white text-gray-800 border-gray-200'
                    } border-2 focus:outline-none focus:border-purple-500`}
                  >
                    <option value="personal">👤 Personal</option>
                    <option value="work">💼 Work</option>
                    <option value="shopping">🛒 Shopping</option>
                    <option value="health">❤️ Health</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white text-gray-800 border-gray-200'
                    } border-2 focus:outline-none focus:border-purple-500`}
                  />
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                rows={2}
                className={`w-full px-4 py-3 rounded-lg ${
                  darkMode
                    ? 'bg-gray-600 text-white placeholder-gray-400 border-gray-500'
                    : 'bg-white text-gray-800 placeholder-gray-400 border-gray-200'
                } border-2 focus:outline-none focus:border-purple-500`}
              />

              <button
                onClick={addTodo}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
              >
                ✓ Add Task
              </button>
            </div>
          )}
        </div>

        {/* Filters & Sort */}
        <div
          className={`${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl shadow-xl p-4 md:p-6 mb-6 transition-colors duration-300`}
        >
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === f
                      ? 'bg-purple-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as Category | 'all')
              }
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              } border focus:outline-none focus:border-purple-500`}
            >
              <option value="all">All Categories</option>
              <option value="personal">👤 Personal</option>
              <option value="work">💼 Work</option>
              <option value="shopping">🛒 Shopping</option>
              <option value="health">❤️ Health</option>
              <option value="other">📌 Other</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              } border focus:outline-none focus:border-purple-500`}
            >
              <option value="date">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="alphabetical">Sort A-Z</option>
              <option value="dueDate">Sort by Due Date</option>
            </select>
          </div>
        </div>

        {/* Todo List */}
        <div
          className={`${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-2xl shadow-xl p-4 md:p-6 transition-colors duration-300`}
        >
          {filteredTodos.length === 0 ? (
            <div
              className={`text-center py-12 ${
                darkMode ? 'text-gray-400' : 'text-gray-400'
              }`}
            >
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg">
                {searchQuery
                  ? 'No tasks match your search'
                  : 'No tasks yet. Add one to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`group p-4 rounded-xl transition-all ${
                    todo.completed
                      ? darkMode
                        ? 'bg-gray-700/50'
                        : 'bg-gray-50'
                      : darkMode
                      ? 'bg-gray-700 hover:bg-gray-650'
                      : 'bg-white hover:bg-gray-50 shadow-md'
                  } ${
                    isOverdue(todo.dueDate) && !todo.completed
                      ? 'border-l-4 border-red-500'
                      : isDueToday(todo.dueDate) && !todo.completed
                      ? 'border-l-4 border-yellow-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : darkMode
                          ? 'border-gray-500 hover:border-purple-500'
                          : 'border-gray-300 hover:border-purple-500'
                      }`}
                    >
                      {todo.completed && (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === todo.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === 'Enter' && saveEdit(todo.id)
                            }
                            className={`flex-1 px-3 py-1 rounded-lg ${
                              darkMode
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            } border-2 border-purple-500 focus:outline-none`}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(todo.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-lg ${
                              todo.completed
                                ? 'line-through text-gray-400'
                                : darkMode
                                ? 'text-white'
                                : 'text-gray-800'
                            }`}
                          >
                            {todo.text}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                priorityColors[todo.priority]
                              }`}
                            >
                              {todo.priority === 'high'
                                ? '🔴'
                                : todo.priority === 'medium'
                                ? '🟡'
                                : '🟢'}{' '}
                              {todo.priority}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                categoryColors[todo.category]
                              }`}
                            >
                              {categoryIcons[todo.category]} {todo.category}
                            </span>
                            {todo.dueDate && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isOverdue(todo.dueDate) && !todo.completed
                                    ? 'bg-red-100 text-red-700'
                                    : isDueToday(todo.dueDate)
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                📅{' '}
                                {new Date(todo.dueDate).toLocaleDateString()}
                                {isOverdue(todo.dueDate) &&
                                  !todo.completed &&
                                  ' (Overdue!)'}
                                {isDueToday(todo.dueDate) &&
                                  !todo.completed &&
                                  ' (Today!)'}
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {todo.notes && (
                            <p
                              className={`mt-2 text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              📝 {todo.notes}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Priority Quick Change */}
                      <select
                        value={todo.priority}
                        onChange={(e) =>
                          updatePriority(todo.id, e.target.value as Priority)
                        }
                        className={`text-xs px-2 py-1 rounded ${
                          darkMode
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="low">🟢</option>
                        <option value="medium">🟡</option>
                        <option value="high">🔴</option>
                      </select>

                      <button
                        onClick={() => startEditing(todo)}
                        className={`p-2 rounded-lg ${
                          darkMode
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className={`p-2 rounded-lg ${
                          darkMode
                            ? 'hover:bg-red-900/50 text-red-400'
                            : 'hover:bg-red-50 text-red-500'
                        }`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          {todos.length > 0 && (
            <div
              className={`mt-6 pt-4 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } flex justify-between items-center`}
            >
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {stats.active} tasks remaining
              </span>
              {stats.completed > 0 && (
                <button
                  onClick={clearCompleted}
                  className={`text-sm ${
                    darkMode
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-red-500 hover:text-red-600'
                  } transition-colors`}
                >
                  Clear completed ({stats.completed})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div
            className={`mt-6 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl shadow-xl p-4 md:p-6`}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`font-medium ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}
              >
                Progress
              </span>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {Math.round((stats.completed / stats.total) * 100)}% complete
              </span>
            </div>
            <div
              className={`h-4 rounded-full ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              } overflow-hidden`}
            >
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${(stats.completed / stats.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


