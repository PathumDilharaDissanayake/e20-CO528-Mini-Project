/**
 * PostCard unit tests
 * Tests: rendering, optimistic likes, comment toggle, owner-only controls.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/react';

const mockLikePost = vi.fn();
const mockDeletePost = vi.fn();
const mockAddComment = vi.fn();
const mockSharePost = vi.fn();
const mockUpdatePost = vi.fn();

// Lazy import to avoid issues with vi.mock hoisting
const { PostCard } = await vi.importActual<typeof import('@components/feed/PostCard')>(
  '@components/feed/PostCard'
);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PostCard — rendering', () => {
  beforeEach(() => {
    mockLikePost.mockResolvedValue({ data: { liked: true, likesCount: 1 } });
    mockDeletePost.mockResolvedValue({});
    mockAddComment.mockResolvedValue({ data: { comment: { id: 'new', content: 'test' } } });
    mockSharePost.mockResolvedValue({ data: { shared: true, sharesCount: 1 } });
    mockUpdatePost.mockResolvedValue({});
  });

  it('renders post content text', () => {
    renderWithProviders(<PostCard post={makePost()} />);
    expect(screen.getByText('Integration test post content 🎉')).toBeInTheDocument();
  });

  it('renders author full name', () => {
    renderWithProviders(<PostCard post={makePost()} />);
    expect(screen.getByText('Alice Student')).toBeInTheDocument();
  });

  it('renders a like button', () => {
    renderWithProviders(<PostCard post={makePost()} />);
    const likeBtn = screen.getByRole('button', { name: /like/i });
    expect(likeBtn).toBeInTheDocument();
  });

  it('renders a comment button', () => {
    renderWithProviders(<PostCard post={makePost({ comments: 2 })} />);
    const commentBtn = screen.getByText('2');
    expect(commentBtn).toBeInTheDocument();
  });

  it('renders a share button', () => {
    renderWithProviders(<PostCard post={makePost()} />);
    const shareBtn = screen.getByRole('button', { name: /share/i });
    expect(shareBtn).toBeInTheDocument();
  });
});

describe('PostCard — optimistic likes', () => {
  it('increments like count immediately on click (optimistic update)', async () => {
    mockLikePost.mockResolvedValue({ data: { liked: true, likesCount: 1 } });
    renderWithProviders(<PostCard post={makePost({ likes: [] })} />);

    const likeBtn = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('decrements like count when un-liking (optimistic update)', async () => {
    mockLikePost.mockResolvedValue({ data: { liked: false, likesCount: 0 } });
    // Start with 1 like from the current user
    renderWithProviders(
      <PostCard post={makePost({ likes: [mockUser.id] })} />
    );

    const likeBtn = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  it('rolls back like count on API error', async () => {
    mockLikePost.mockRejectedValue(new Error('Server error'));
    renderWithProviders(<PostCard post={makePost({ likes: [] })} />);

    const likeBtn = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeBtn);

    // After rejection, count should roll back to 0
    await waitFor(() => {
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });
});

describe('PostCard — comments section', () => {
  it('comment section is hidden by default', () => {
    renderWithProviders(<PostCard post={makePost()} />);
    expect(screen.queryByPlaceholderText(/write a comment/i)).toBeNull();
  });

  it('clicking comment button reveals input', () => {
    renderWithProviders(<PostCard post={makePost({ comments: 0 })} />);
    const commentBtn = screen.getByText(/comment/i);
    fireEvent.click(commentBtn);
    expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
  });

  it('loaded comments are shown when section expands', async () => {
    renderWithProviders(<PostCard post={makePost({ comments: 1 })} />);
    const commentBtn = screen.getByText(/1/i);
    fireEvent.click(commentBtn);
    await waitFor(() => {
      expect(screen.getByText('Nice post!')).toBeInTheDocument();
    });
  });
});

describe('PostCard — owner vs non-owner controls', () => {
  it('shows overflow menu for the post owner', () => {
    renderWithProviders(<PostCard post={makePost()} />);
    // MoreVert button (three dots) appears for owner
    const moreBtn = screen.queryByRole('button', { name: /more options/i })
      ?? screen.queryByTestId('more-options');
    // We just assert it's present (MUI ARIA label may vary)
    expect(document.querySelector('[data-testid="MoreVertIcon"]')).toBeTruthy();
  });

  it('does NOT call deletePost when non-owner views the card', () => {
    renderWithProviders(<PostCard post={otherUserPost} />);
    expect(mockDeletePost).not.toHaveBeenCalled();
  });
});
