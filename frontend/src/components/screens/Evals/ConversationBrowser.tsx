"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EvalConversation } from "@/types/evals";

interface ConversationBrowserProps {
  conversations: EvalConversation[];
  onConversationsChange?: (conversations: EvalConversation[]) => void;
}

interface ExpandedConversation {
  id: string;
  showMessages: boolean;
  showFeedback: boolean;
}

const ConversationRow: React.FC<{
  conversation: EvalConversation;
  expanded: ExpandedConversation;
  onToggleMessages: () => void;
  onToggleFeedback: () => void;
}> = ({ conversation, expanded, onToggleMessages, onToggleFeedback }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Removed unused getScoreColor function

  const getScoreBadge = (score: number | null) => {
    if (score === null) return "bg-gray-100 text-gray-400";
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <>
      {/* Main conversation row */}
      <tr className="hover:bg-gray-50 border-b">
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(conversation.created_at)}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {conversation.organization_name}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">
          <div className="max-w-xs truncate" title={conversation.scenario.title}>
            {conversation.scenario.title}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">
          <div className="max-w-xs truncate" title={conversation.persona.name}>
            {conversation.persona.name}
          </div>
          <div className="text-xs text-gray-500">
            {conversation.persona.job}, {conversation.persona.age}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {conversation.message_count}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-center">
          {conversation.feedback_score !== null ? (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreBadge(conversation.feedback_score)}`}>
              {conversation.feedback_score.toFixed(1)}/5
            </span>
          ) : (
            <span className="text-gray-400 text-xs">No score</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleMessages}
              className="text-xs"
            >
              {expanded.showMessages ? 'Hide' : 'Show'} Messages
            </Button>
            {conversation.has_feedback && (
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleFeedback}
                className="text-xs"
              >
                {expanded.showFeedback ? 'Hide' : 'Show'} Feedback
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded messages */}
      {expanded.showMessages && (
        <tr>
          <td colSpan={7} className="px-4 py-6 bg-gray-50">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Conversation Messages</h4>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {message.role === 'user' ? '👤 User' : '🤖 Assistant'} • 
                        {formatDate(message.created_at)}
                      </div>
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Expanded feedback */}
      {expanded.showFeedback && conversation.has_feedback && (
        <tr>
          <td colSpan={7} className="px-4 py-6 bg-yellow-50">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">AI Feedback</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-green-700 mb-2">💪 Strengths</h5>
                  <div className="space-y-2">
                    {conversation.feedback_strengths.map((strength, index) => (
                      <div key={index} className="bg-green-50 p-3 rounded border border-green-200">
                        <div className="font-medium text-green-800">{strength.title}</div>
                        <div className="text-sm text-green-700 mt-1">{strength.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-orange-700 mb-2">🎯 Areas for Improvement</h5>
                  <div className="space-y-2">
                    {conversation.feedback_areas_for_improvement.map((improvement, index) => (
                      <div key={index} className="bg-orange-50 p-3 rounded border border-orange-200">
                        <div className="font-medium text-orange-800">{improvement.title}</div>
                        <div className="text-sm text-orange-700 mt-1">{improvement.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {conversation.feedback_summary && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">📋 Summary</h5>
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">{conversation.feedback_summary}</p>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export const ConversationBrowser: React.FC<ConversationBrowserProps> = ({
  conversations
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'length'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedConversations, setExpandedConversations] = useState<Record<string, ExpandedConversation>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = conversations.filter(conv =>
        conv.scenario.title.toLowerCase().includes(term) ||
        conv.persona.name.toLowerCase().includes(term) ||
        conv.organization_name.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'score':
          aValue = a.feedback_score || 0;
          bValue = b.feedback_score || 0;
          break;
        case 'length':
          aValue = a.message_count;
          bValue = b.message_count;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [conversations, searchTerm, sortBy, sortOrder]);

  const paginatedConversations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedConversations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedConversations, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedConversations.length / itemsPerPage);

  const toggleConversationMessages = (conversationId: string) => {
    setExpandedConversations(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        id: conversationId,
        showMessages: !prev[conversationId]?.showMessages,
        showFeedback: prev[conversationId]?.showFeedback || false
      }
    }));
  };

  const toggleConversationFeedback = (conversationId: string) => {
    setExpandedConversations(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        id: conversationId,
        showMessages: prev[conversationId]?.showMessages || false,
        showFeedback: !prev[conversationId]?.showFeedback
      }
    }));
  };

  const handleSort = (newSortBy: 'date' | 'score' | 'length') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Conversation Browser</h2>
      
      <Card className="p-6">
        {/* Filters and controls */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search scenarios, personas, or organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('date')}
            >
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'score' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('score')}
            >
              Score {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button
              variant={sortBy === 'length' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('length')}
            >
              Length {sortBy === 'length' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        </div>

        {/* Results summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {paginatedConversations.length} of {filteredAndSortedConversations.length} conversations
          {searchTerm && ` (filtered from ${conversations.length} total)`}
        </div>

        {/* Conversation table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedConversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No conversations match your search' : 'No conversations found'}
                  </td>
                </tr>
              ) : (
                paginatedConversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    expanded={expandedConversations[conversation.id] || { id: conversation.id, showMessages: false, showFeedback: false }}
                    onToggleMessages={() => toggleConversationMessages(conversation.id)}
                    onToggleFeedback={() => toggleConversationFeedback(conversation.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
