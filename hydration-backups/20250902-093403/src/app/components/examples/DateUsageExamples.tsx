// Usage examples for SafeDate and date utilities in Daily Tidbit

import React from 'react';
import { SafeDate, formatDate, getCurrentYear, useRelativeTime } from '../../lib/dateUtils';

// ===== EXAMPLE 1: Post/Article Timestamps =====
interface PostCardProps {
  title: string;
  content: string;
  publishedAt: string;
  updatedAt?: string;
}

const PostCard: React.FC<PostCardProps> = ({ title, content, publishedAt, updatedAt }) => {
  return (
    <article className="bg-white rounded-lg shadow-lg p-6 hover-lift">
      <h2 className="heading-section text-gray-900 mb-3">{title}</h2>
      
      <p className="body-medium text-gray-600 mb-4 line-clamp-3">
        {content}
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          {/* Hydration-safe relative time */}
          <SafeDate 
            date={publishedAt} 
            format="relative" 
            className="flex items-center gap-1"
          />
          
          {updatedAt && updatedAt !== publishedAt && (
            <span className="text-brand-blue">
              Updated <SafeDate date={updatedAt} format="relative" />
            </span>
          )}
        </div>
        
        <button className="bg-brand-green hover:bg-brand-greenDark text-white px-4 py-2 rounded-lg transition-colors">
          Read More
        </button>
      </div>
    </article>
  );
};

// ===== EXAMPLE 2: Comment System =====
interface CommentProps {
  author: string;
  content: string;
  createdAt: string;
  isOwner?: boolean;
}

const Comment: React.FC<CommentProps> = ({ author, content, createdAt, isOwner }) => {
  // Using the hook for updating relative time
  const relativeTime = useRelativeTime(createdAt);
  
  return (
    <div className={`p-4 rounded-lg ${isOwner ? 'bg-brand-green/10 border-l-4 border-brand-green' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="body-bold text-gray-900">{author}</span>
        <time 
          dateTime={formatDate.iso(createdAt)}
          className="body-small text-gray-500"
          title={formatDate.absolute(createdAt)} // Tooltip shows full date
        >
          {relativeTime}
        </time>
      </div>
      
      <p className="body-medium text-gray-700">{content}</p>
    </div>
  );
};

// ===== EXAMPLE 3: Dashboard Activity Feed =====
interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'like' | 'share';
  message: string;
  timestamp: string;
  user: string;
}

const ActivityFeed: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <h3 className="heading-subsection text-gray-900">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'post' ? 'bg-brand-green' :
                activity.type === 'comment' ? 'bg-brand-blue' :
                activity.type === 'like' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              
              <div className="flex-1">
                <p className="body-medium text-gray-900 mb-1">
                  <span className="font-semibold">{activity.user}</span> {activity.message}
                </p>
                
                {/* Show different formats based on how recent */}
                <SafeDate 
                  date={activity.timestamp} 
                  format="relative" 
                  className="body-small text-gray-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== EXAMPLE 4: Event Calendar =====
interface EventProps {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
}

const EventCard: React.FC<EventProps> = ({ title, description, startDate, endDate, location }) => {
  const isUpcoming = new Date(startDate) > new Date();
  const isSameDay = formatDate.short(startDate) === formatDate.short(endDate);
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${
      isUpcoming ? 'border-brand-green' : 'border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="heading-subsection text-gray-900">{title}</h3>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isUpcoming 
            ? 'bg-brand-green/10 text-brand-green' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isUpcoming ? 'Upcoming' : 'Past'}
        </span>
      </div>
      
      <p className="body-medium text-gray-600 mb-4">{description}</p>
      
      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-4">📅</span>
          {isSameDay ? (
            <span>
              <SafeDate date={startDate} format="absolute" /> • {' '}
              <SafeDate date={startDate} format="time" /> - {' '}
              <SafeDate date={endDate} format="time" />
            </span>
          ) : (
            <span>
              <SafeDate date={startDate} format="absolute" /> - {' '}
              <SafeDate date={endDate} format="absolute" />
            </span>
          )}
        </div>
        
        {location && (
          <div className="flex items-center gap-2">
            <span className="w-4">📍</span>
            <span>{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== EXAMPLE 5: Footer Copyright =====
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h4 className="heading-subsection text-white mb-4">Daily Tidbit</h4>
            <p className="body-medium text-gray-300">
              Learn how to use AI to make life easier, more creative, and more fun. 
              One smart tip a day.
            </p>
          </div>
          
          <div>
            <h5 className="body-bold text-white mb-4">Quick Links</h5>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-brand-green transition-colors">About</a></li>
              <li><a href="/tips" className="text-gray-300 hover:text-brand-green transition-colors">All Tips</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-brand-green transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="body-bold text-white mb-4">Legal</h5>
            <ul className="space-y-2">
              <li><a href="/privacy" className="text-gray-300 hover:text-brand-green transition-colors">Privacy</a></li>
              <li><a href="/terms" className="text-gray-300 hover:text-brand-green transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="body-small text-gray-400">
            © {getCurrentYear()} Daily Tidbit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ===== EXAMPLE 6: Admin Dashboard Stats =====
interface StatsCardProps {
  title: string;
  value: number;
  change: number;
  timeframe: string;
  lastUpdated: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, timeframe, lastUpdated }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <h4 className="body-bold text-gray-600">{title}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isPositive ? '+' : ''}{change}% {timeframe}
        </span>
      </div>
      
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
        </span>
      </div>
      
      <div className="text-xs text-gray-500">
        Last updated: <SafeDate date={lastUpdated} format="relative" />
      </div>
    </div>
  );
};

export {
  PostCard,
  Comment,
  ActivityFeed,
  EventCard,
  Footer,
  StatsCard
};