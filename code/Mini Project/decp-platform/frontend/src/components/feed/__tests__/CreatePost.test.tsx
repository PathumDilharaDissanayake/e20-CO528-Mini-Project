import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { CreatePost } from '../CreatePost';

const mockCreatePost = vi.fn();

describe('CreatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit post with an image', async () => {
    mockCreatePost.mockResolvedValue({ data: {}, success: true });
    renderWithProviders(<CreatePost />);

    const contentInput = screen.getByPlaceholderText(/What's on your mind?/i);
    fireEvent.change(contentInput, { target: { value: 'Test image post' } });

    const imageFile = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Add photo').querySelector('input');

    // Due to the setup, we can't directly use fireEvent.change on the hidden input.
    // We'll have to reach into the component's implementation a bit.
    // A better approach would be to have a visible label for the input.
    const fileInputElement = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInputElement, 'files', {
        value: [imageFile],
        writable: false,
    });
    fireEvent.change(fileInputElement);

    const postButton = screen.getByRole('button', { name: /post/i });
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
      const formData = mockCreatePost.mock.calls[0][0] as FormData;
      expect(formData.get('content')).toBe('Test image post');
      expect(formData.get('type')).toBe('image');
      const mediaFile = formData.get('media') as File;
      expect(mediaFile.name).toBe('chucknorris.png');
      expect(mediaFile.type).toBe('image/png');
    });
  });

  it('should submit post with a video', async () => {
    mockCreatePost.mockResolvedValue({ data: {}, success: true });
    renderWithProviders(<CreatePost />);

    const contentInput = screen.getByPlaceholderText(/What's on your mind?/i);
    fireEvent.change(contentInput, { target: { value: 'Test video post' } });

    const videoFile = new File(['(⌐□_□)'], 'coolvideo.mp4', { type: 'video/mp4' });
    const fileInputElement = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInputElement, 'files', {
        value: [videoFile],
        writable: false,
    });
    fireEvent.change(fileInputElement);

    const postButton = screen.getByRole('button', { name: /post/i });
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledTimes(1);
      const formData = mockCreatePost.mock.calls[0][0] as FormData;
      expect(formData.get('content')).toBe('Test video post');
      expect(formData.get('type')).toBe('video');
      const mediaFile = formData.get('media') as File;
      expect(mediaFile.name).toBe('coolvideo.mp4');
      expect(mediaFile.type).toBe('video/mp4');
    });
  });
});
