import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Post, PaginatedResponse, PaginationParams } from '../types';
import { feedService } from '../services/feedService';

interface FeedState {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
}

const initialState: FeedState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  total: 0,
};

export const fetchPosts = createAsyncThunk(
  'feed/fetchPosts',
  async (params: PaginationParams = {}, { rejectWithValue }) => {
    try {
      const response = await feedService.getPosts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const fetchMorePosts = createAsyncThunk(
  'feed/fetchMorePosts',
  async (params: PaginationParams = {}, { rejectWithValue }) => {
    try {
      const response = await feedService.getPosts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch more posts');
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'feed/fetchPostById',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await feedService.getPostById(postId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch post');
    }
  }
);

export const createPost = createAsyncThunk(
  'feed/createPost',
  async (postData: { content: string; media?: any[] }, { rejectWithValue }) => {
    try {
      const response = await feedService.createPost(postData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
  }
);

export const updatePost = createAsyncThunk(
  'feed/updatePost',
  async ({ postId, data }: { postId: string; data: Partial<Post> }, { rejectWithValue }) => {
    try {
      const response = await feedService.updatePost(postId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'feed/deletePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      await feedService.deletePost(postId);
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
  }
);

export const likePost = createAsyncThunk(
  'feed/likePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await feedService.likePost(postId);
      return { postId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
  }
);

export const unlikePost = createAsyncThunk(
  'feed/unlikePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await feedService.unlikePost(postId);
      return { postId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unlike post');
    }
  }
);

export const addComment = createAsyncThunk(
  'feed/addComment',
  async ({ postId, content }: { postId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await feedService.addComment(postId, content);
      return { postId, comment: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'feed/deleteComment',
  async ({ postId, commentId }: { postId: string; commentId: string }, { rejectWithValue }) => {
    try {
      await feedService.deleteComment(postId, commentId);
      return { postId, commentId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    resetFeed: (state) => {
      state.posts = [];
      state.page = 1;
      state.hasMore = true;
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Posts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Post>>) => {
        state.isLoading = false;
        state.posts = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch More Posts
      .addCase(fetchMorePosts.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMorePosts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Post>>) => {
        state.isLoadingMore = false;
        state.posts = [...state.posts, ...action.payload.data];
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMorePosts.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      // Fetch Post by ID
      .addCase(fetchPostById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action: PayloadAction<Post>) => {
        state.isLoading = false;
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.isLoading = false;
        state.posts = [action.payload, ...state.posts];
        state.total += 1;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Post
      .addCase(updatePost.fulfilled, (state, action: PayloadAction<Post>) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.currentPost?.id === action.payload.id) {
          state.currentPost = action.payload;
        }
      })
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action: PayloadAction<string>) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
        state.total -= 1;
        if (state.currentPost?.id === action.payload) {
          state.currentPost = null;
        }
      })
      // Like/Unlike Post
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.likes = likes;
          post.isLiked = true;
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.likes = likes;
          state.currentPost.isLiked = true;
        }
      })
      .addCase(unlikePost.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.likes = likes;
          post.isLiked = false;
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.likes = likes;
          state.currentPost.isLiked = false;
        }
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.comments = [...post.comments, comment];
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.comments = [...state.currentPost.comments, comment];
        }
      })
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId, commentId } = action.payload;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.comments = post.comments.filter((c) => c.id !== commentId);
        }
        if (state.currentPost?.id === postId) {
          state.currentPost.comments = state.currentPost.comments.filter((c) => c.id !== commentId);
        }
      });
  },
});

export const { clearError, clearCurrentPost, resetFeed } = feedSlice.actions;
export default feedSlice.reducer;
