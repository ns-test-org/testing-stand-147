'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

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

const categoryD3Colors: Record<Category, string> = {
  personal: '#3B82F6',
  work: '#8B5CF6',
  shopping: '#F97316',
  health: '#EC4899',
  other: '#6B7280',
};

const priorityD3Colors: Record<Priority, string> = {
  low: '#22C55E',
  medium: '#EAB308',
  high: '#EF4444',
};

// Animated Progress Ring Component
function ProgressRing({ progress, darkMode }: { progress: number; darkMode: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 120;
    const height = 120;
    const radius = 50;
    const strokeWidth = 10;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Background circle
    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', darkMode ? '#374151' : '#E5E7EB')
      .attr('stroke-width', strokeWidth);

    // Progress arc
    const arc = d3.arc<unknown>()
      .innerRadius(radius - strokeWidth / 2)
      .outerRadius(radius + strokeWidth / 2)
      .startAngle(0)
      .cornerRadius(5);

    const progressArc = g.append('path')
      .datum({ endAngle: 0 })
      .attr('fill', 'url(#progressGradient)')
      .attr('d', arc as unknown as string);

    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'progressGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#8B5CF6');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#EC4899');

    // Animate progress
    progressArc
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(0, (progress / 100) * 2 * Math.PI);
        return function(t: number) {
          return arc({ endAngle: interpolate(t) }) || '';
        };
      });

    // Center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', darkMode ? '#fff' : '#1F2937')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .text('0%')
      .transition()
      .duration(1000)
      .tween('text', function() {
        const interpolate = d3.interpolate(0, progress);
        return function(t: number) {
          d3.select(this).text(`${Math.round(interpolate(t))}%`);
        };
      });

  }, [progress, darkMode]);

  return <svg ref={svgRef} className="mx-auto" />;
}

// Category Pie Chart Component
function CategoryPieChart({ todos, darkMode }: { todos: Todo[]; darkMode: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || todos.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2 - 10;

    // Count by category
    const categoryCount = todos.reduce((acc, todo) => {
      acc[todo.category] = (acc[todo.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(categoryCount).map(([key, value]) => ({
      category: key as Category,
      count: value,
    }));

    const pie = d3.pie<{ category: Category; count: number }>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ category: Category; count: number }>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('fill', d => categoryD3Colors[d.data.category])
      .attr('stroke', darkMode ? '#1F2937' : '#fff')
      .attr('stroke-width', 2)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t: number) {
          return arc(interpolate(t)) || '';
        };
      });

    // Add icons
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '16px')
      .style('opacity', 0)
      .text(d => categoryIcons[d.data.category])
      .transition()
      .delay(800)
      .duration(300)
      .style('opacity', 1);

  }, [todos, darkMode]);

  if (todos.length === 0) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Add tasks to see category breakdown</p>
      </div>
    );
  }

  return <svg ref={svgRef} className="mx-auto" />;
}

// Priority Bar Chart Component
function PriorityBarChart({ todos, darkMode }: { todos: Todo[]; darkMode: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 280 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const priorities: Priority[] = ['high', 'medium', 'low'];
    const data = priorities.map(p => ({
      priority: p,
      active: todos.filter(t => t.priority === p && !t.completed).length,
      completed: todos.filter(t => t.priority === p && t.completed).length,
    }));

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .domain(priorities)
      .range([0, width])
      .padding(0.3);

    const maxVal = Math.max(1, d3.max(data, d => d.active + d.completed) || 1);
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .range([height, 0]);

    // X axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d === 'high' ? '🔴' : d === 'medium' ? '🟡' : '🟢'))
      .selectAll('text')
      .attr('font-size', '16px');

    g.selectAll('.domain, .tick line').attr('stroke', darkMode ? '#4B5563' : '#D1D5DB');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', darkMode ? '#9CA3AF' : '#6B7280');

    g.selectAll('.domain, .tick line').attr('stroke', darkMode ? '#4B5563' : '#D1D5DB');

    // Stacked bars
    const subgroups = ['completed', 'active'];
    const stackedData = d3.stack<{ priority: Priority; active: number; completed: number }>()
      .keys(subgroups)(data);

    const color = d3.scaleOrdinal<string>()
      .domain(subgroups)
      .range([darkMode ? '#374151' : '#D1D5DB', '']);

    g.selectAll('.layer')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', (d, i) => i === 0 ? (darkMode ? '#374151' : '#D1D5DB') : '')
      .selectAll('rect')
      .data(d => d.map((item, idx) => ({ ...item, priority: data[idx].priority })))
      .enter()
      .append('rect')
      .attr('x', d => x(d.priority) || 0)
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', (d, i, nodes) => {
        const parentData = d3.select(nodes[i].parentNode as Element).datum() as { key: string };
        if (parentData.key === 'completed') {
          return darkMode ? '#374151' : '#D1D5DB';
        }
        return priorityD3Colors[d.priority];
      })
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay((_, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]));

  }, [todos, darkMode]);

  return <svg ref={svgRef} className="mx-auto" />;
}

// Weekly Activity Chart
function WeeklyActivityChart({ todos, darkMode }: { todos: Todo[]; darkMode: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 320 - margin.left - margin.right;
    const height = 160 - margin.top - margin.bottom;

    // Get last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const data = days.map(date => {
      const dateStr = date.toDateString();
      const count = todos.filter(t => {
        const created = new Date(t.createdAt).toDateString();
        return created === dateStr;
      }).length;
      return {
        day: dayNames[date.getDay()],
        count,
        date,
      };
    });

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scalePoint<string>()
      .domain(data.map(d => d.day))
      .range([0, width]);

    const maxVal = Math.max(1, d3.max(data, d => d.count) || 1);
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .range([height, 0]);

    // Grid lines
    g.selectAll('.grid-line')
      .data(y.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', darkMode ? '#374151' : '#E5E7EB')
      .attr('stroke-dasharray', '3,3');

    // Line
    const line = d3.line<{ day: string; count: number }>()
      .x(d => x(d.day) || 0)
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // Gradient for area
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#8B5CF6')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#8B5CF6')
      .attr('stop-opacity', 0);

    // Area
    const area = d3.area<{ day: string; count: number }>()
      .x(d => x(d.day) || 0)
      .y0(height)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#areaGradient)')
      .attr('d', area);

    // Animated line
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#8B5CF6')
      .attr('stroke-width', 3)
      .attr('d', line);

    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Dots
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.day) || 0)
      .attr('cy', d => y(d.count))
      .attr('r', 0)
      .attr('fill', '#8B5CF6')
      .attr('stroke', darkMode ? '#1F2937' : '#fff')
      .attr('stroke-width', 2)
      .transition()
      .delay(1500)
      .duration(300)
      .attr('r', 5);

    // X axis
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', darkMode ? '#9CA3AF' : '#6B7280')
      .attr('font-size', '11px');

    g.selectAll('.domain').attr('stroke', darkMode ? '#4B5563' : '#D1D5DB');
    g.selectAll('.tick line').attr('stroke', 'transparent');

  }, [todos, darkMode]);

  return <svg ref={svgRef} className="mx-auto" />;
}

// Floating particles animation
function FloatingParticles({ darkMode }: { darkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];
    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#22C55E', '#F97316'];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '40';
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.5 }}
    />
  );
}

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
  const [showStats, setShowStats] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [addedId, setAddedId] = useState<number | null>(null);

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

  const addTodo = useCallback(() => {
    if (inputValue.trim() === '') return;

    const newId = Date.now();
    const newTodo: Todo = {
      id: newId,
      text: inputValue,
      completed: false,
      priority,
      category,
      dueDate: dueDate || null,
      createdAt: new Date(),
      notes,
    };

    setTodos(prev => [newTodo, ...prev]);
    setInputValue('');
    setDueDate('');
    setNotes('');
    setPriority('medium');
    setCategory('personal');
    setShowAddForm(false);
    setAddedId(newId);
    setTimeout(() => setAddedId(null), 500);
  }, [inputValue, priority, category, dueDate, notes]);

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setDeletingId(id);
    setTimeout(() => {
      setTodos(todos.filter((todo) => todo.id !== id));
      setDeletingId(null);
    }, 300);
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

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

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
      className={`min-h-screen transition-colors duration-500 ${
        darkMode
          ? 'bg-gray-900'
          : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
      } p-4 md:p-8 relative overflow-hidden`}
    >
      <FloatingParticles darkMode={darkMode} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div
          className={`${
            darkMode ? 'bg-gray-800/90' : 'bg-white/90'
          } backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 mb-6 transition-all duration-500 transform hover:scale-[1.01]`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="animate-fadeIn">
              <h1
                className={`text-3xl md:text-4xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-800'
                } flex items-center gap-3`}
              >
                <span className="animate-bounce">✨</span> Task Master v2
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Organize your life, one task at a time
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-3 rounded-full ${
                  darkMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-600'
                } transition-all hover:scale-110 active:scale-95`}
              >
                📊
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-full ${
                  darkMode
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-800 text-yellow-400'
                } transition-all hover:scale-110 hover:rotate-12 active:scale-95`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* D3 Visualizations Dashboard */}
          {showStats && (
            <div className={`mb-6 p-6 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-all duration-500 animate-slideDown`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                📈 Analytics Dashboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Progress Ring */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-sm font-medium mb-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Completion Rate
                  </h3>
                  <ProgressRing progress={progressPercent} darkMode={darkMode} />
                </div>

                {/* Category Pie Chart */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-sm font-medium mb-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    By Category
                  </h3>
                  <CategoryPieChart todos={todos} darkMode={darkMode} />
                </div>

                {/* Priority Bar Chart */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-sm font-medium mb-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    By Priority
                  </h3>
                  <PriorityBarChart todos={todos} darkMode={darkMode} />
                </div>

                {/* Weekly Activity */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`text-sm font-medium mb-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Weekly Activity
                  </h3>
                  <WeeklyActivityChart todos={todos} darkMode={darkMode} />
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'indigo', icon: '📋' },
              { label: 'Active', value: stats.active, color: 'blue', icon: '⏳' },
              { label: 'Done', value: stats.completed, color: 'green', icon: '✅' },
              { label: 'Urgent', value: stats.highPriority, color: 'red', icon: '🔥' },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className={`${
                  darkMode ? 'bg-gray-700' : `bg-${stat.color}-50`
                } rounded-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div
                  className={`text-2xl font-bold ${
                    darkMode ? `text-${stat.color}-400` : `text-${stat.color}-600`
                  }`}
                >
                  {stat.value}
                </div>
                <div
                  className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search tasks..."
              className={`w-full px-4 py-3 rounded-xl ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'
              } border-2 focus:outline-none focus:border-purple-500 transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20`}
            />
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
              showAddForm
                ? 'bg-gray-300 text-gray-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:shadow-purple-500/30'
            }`}
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Task'}
          </button>

          {/* Add Task Form */}
          {showAddForm && (
            <div
              className={`mt-4 p-6 rounded-xl ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              } space-y-4 animate-slideDown`}
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
                } border-2 focus:outline-none focus:border-purple-500 transition-all`}
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
                    } border-2 focus:outline-none focus:border-purple-500 transition-all`}
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
                    } border-2 focus:outline-none focus:border-purple-500 transition-all`}
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
                    } border-2 focus:outline-none focus:border-purple-500 transition-all`}
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
                } border-2 focus:outline-none focus:border-purple-500 transition-all`}
              />

              <button
                onClick={addTodo}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                ✓ Add Task
              </button>
            </div>
          )}
        </div>

        {/* Filters & Sort */}
        <div
          className={`${
            darkMode ? 'bg-gray-800/90' : 'bg-white/90'
          } backdrop-blur-lg rounded-2xl shadow-xl p-4 md:p-6 mb-6 transition-all duration-500`}
        >
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    filter === f
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
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
              } border focus:outline-none focus:border-purple-500 transition-all`}
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
              } border focus:outline-none focus:border-purple-500 transition-all`}
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
            darkMode ? 'bg-gray-800/90' : 'bg-white/90'
          } backdrop-blur-lg rounded-2xl shadow-xl p-4 md:p-6 transition-all duration-500`}
        >
          {filteredTodos.length === 0 ? (
            <div
              className={`text-center py-12 ${
                darkMode ? 'text-gray-400' : 'text-gray-400'
              }`}
            >
              <div className="text-6xl mb-4 animate-bounce">📝</div>
              <p className="text-lg">
                {searchQuery
                  ? 'No tasks match your search'
                  : 'No tasks yet. Add one to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  className={`group p-4 rounded-xl transition-all duration-300 transform ${
                    deletingId === todo.id
                      ? 'scale-0 opacity-0'
                      : addedId === todo.id
                      ? 'animate-slideIn'
                      : 'hover:scale-[1.01]'
                  } ${
                    todo.completed
                      ? darkMode
                        ? 'bg-gray-700/50'
                        : 'bg-gray-50'
                      : darkMode
                      ? 'bg-gray-700 hover:bg-gray-650'
                      : 'bg-white hover:bg-gray-50 shadow-md hover:shadow-lg'
                  } ${
                    isOverdue(todo.dueDate) && !todo.completed
                      ? 'border-l-4 border-red-500'
                      : isDueToday(todo.dueDate) && !todo.completed
                      ? 'border-l-4 border-yellow-500'
                      : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : darkMode
                          ? 'border-gray-500 hover:border-purple-500'
                          : 'border-gray-300 hover:border-purple-500'
                      }`}
                    >
                      {todo.completed && (
                        <svg
                          className="w-4 h-4 animate-checkmark"
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
                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-lg transition-all duration-300 ${
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
                              className={`text-xs px-2 py-1 rounded-full transition-all hover:scale-105 ${
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
                              className={`text-xs px-2 py-1 rounded-full transition-all hover:scale-105 ${
                                categoryColors[todo.category]
                              }`}
                            >
                              {categoryIcons[todo.category]} {todo.category}
                            </span>
                            {todo.dueDate && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full transition-all hover:scale-105 ${
                                  isOverdue(todo.dueDate) && !todo.completed
                                    ? 'bg-red-100 text-red-700 animate-pulse'
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
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
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
                        className={`p-2 rounded-lg transition-all hover:scale-110 ${
                          darkMode
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className={`p-2 rounded-lg transition-all hover:scale-110 ${
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
                  className={`text-sm transition-all hover:scale-105 ${
                    darkMode
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-red-500 hover:text-red-600'
                  }`}
                >
                  Clear completed ({stats.completed})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-checkmark {
          animation: checkmark 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

