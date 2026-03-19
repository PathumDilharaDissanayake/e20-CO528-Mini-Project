import { apiSlice } from './api';
import { Post, PaginatedResponse, ApiResponse } from '@types';

interface CreatePostData {
  content: string;
  media?: File[];
  pollOptions?: Array<{ text: string; votes: string[] }>;
  pollEndsAt?: Date;
}

const normalizePost = (raw: any): Post => {
  const postId = raw?._id || raw?.id || '';
  const userId = raw?.userId || raw?.author?._id || raw?.author?.id || '';

  const normalizedMedia = Array.isArray(raw?.media)
    ? raw.media
    : Array.isArray(raw?.mediaUrls)
      ? raw.mediaUrls.map((url: string) => ({
        url,
        type: /\.(mp4|webm|ogg)$/i.test(url) ? 'video' : 'image',
      }))
      : [];

  // Parse pollOptions if it comes back as a JSON string
  let pollOptions = raw?.pollOptions ?? null;
  if (typeof pollOptions === 'string') {
    try { pollOptions = JSON.parse(pollOptions); } catch { pollOptions = null; }
  }
  const pollEndsAt = raw?.pollEndsAt ?? null;

  return {
    _id: postId,
    id: postId,
    userId,
    author: raw?.author || {
      _id: userId,
      id: userId,
      firstName: 'Community',
      lastName: 'Member',
      role: 'student',
    },
    content: raw?.content || '',
    type: raw?.type || 'text',
    media: normalizedMedia,
    mediaUrls: raw?.mediaUrls || [],
    likes: Array.isArray(raw?.likes) ? raw.likes : Number(raw?.likes || 0),
    comments: Array.isArray(raw?.comments) ? raw.comments : Number(raw?.comments || 0),
    shares: Number(raw?.shares || 0),
    pollOptions,
    pollEndsAt,
    myReaction: raw?.myReaction ?? null,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
};

const toPaginatedPosts = (response: any): PaginatedResponse<Post> => {
  const items = Array.isArray(response?.data) ? response.data : [];
  const page = Number(response?.meta?.page || 1);
  const limit = Number(response?.meta?.limit || items.length || 10);
  const total = Number(response?.meta?.total || items.length || 0);
  const totalPages = Number(response?.meta?.totalPages || 1);

  return {
    data: items.map(normalizePost),
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
};

export const postApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<PaginatedResponse<Post>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `/posts/feed?page=${page}&limit=${limit}`,
      transformResponse: (response: any) => toPaginatedPosts(response),
      providesTags: (result) =>
        result
          ? [
            ...result.data.map(({ _id, id }) => ({ type: 'Post' as const, id: _id || id })),
            { type: 'Post', id: 'LIST' },
          ]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    getPostById: builder.query<ApiResponse<Post>, string>({
      query: (id) => `/posts/${id}`,
      transformResponse: (response: any) => ({
        ...response,
        data: normalizePost(response?.data?.post || response?.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    getUserPosts: builder.query<PaginatedResponse<Post>, { userId: string; page?: number; limit?: number }>({
      query: ({ userId, page = 1, limit = 20 }) =>
        `/posts/feed?userId=${userId}&page=${page}&limit=${limit}`,
      transformResponse: (response: any) => toPaginatedPosts(response),
      providesTags: ['Post'],
    }),
    getPostComments: builder.query<ApiResponse<any[]>, string>({
      query: (postId) => `/posts/${postId}/comments`,
      transformResponse: (response: any) => ({
        ...response,
        data: Array.isArray(response?.data) ? response.data : [],
      }),
      providesTags: (result, error, id) => [{ type: 'Post', id: `comments-${id}` }],
    }),
    createPost: builder.mutation<ApiResponse<Post>, FormData>({
      query: (data) => ({
        url: '/posts',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizePost(response?.data?.post || response?.data),
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    updatePost: builder.mutation<ApiResponse<Post>, { id: string; data: Partial<CreatePostData> }>({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizePost(response?.data?.post || response?.data),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),
    deletePost: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),
    likePost: builder.mutation<ApiResponse<any>, { postId: string; reactionType?: string }>({
      query: ({ postId, reactionType = 'like' }) => ({
        url: `/posts/${postId}/like`,
        method: 'POST',
        body: { reactionType },
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Post', id: postId }, { type: 'Post', id: 'LIST' }],
    }),
    unlikePost: builder.mutation<ApiResponse<Post>, string>({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }, { type: 'Post', id: 'LIST' }],
    }),
    addComment: builder.mutation<ApiResponse<Post>, { postId: string; content: string }>({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Post', id: postId },
        { type: 'Post', id: `comments-${postId}` },
        { type: 'Post', id: 'LIST' },
      ],
    }),
    deleteComment: builder.mutation<ApiResponse<Post>, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Post', id: postId },
        { type: 'Post', id: `comments-${postId}` },
        { type: 'Post', id: 'LIST' },
      ],
    }),
    sharePost: builder.mutation<ApiResponse<Post>, string>({
      query: (id) => ({
        url: `/posts/${id}/share`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    bookmarkPost: builder.mutation<any, string>({
      query: (postId) => ({ url: `/posts/${postId}/bookmark`, method: 'POST' }),
      invalidatesTags: ['Post'],
    }),
    getBookmarkedPosts: builder.query<any, void>({
      query: () => '/posts/bookmarks/me',
      providesTags: ['Post'],
    }),
    votePoll: builder.mutation<any, { postId: string; optionIndex: number }>({
      query: ({ postId, optionIndex }) => ({
        url: `/posts/${postId}/vote`,
        method: 'POST',
        body: { optionIndex },
      }),
      // The response is { success: true, data: { pollOptions: [...] } }
      // We return the pollOptions directly so the caller can use them
      transformResponse: (response: any) => {
        return response?.data?.pollOptions || null;
      },
      invalidatesTags: (result, error, { postId }) => [{ type: 'Post', id: postId }, { type: 'Post', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetUserPostsQuery,
  useGetPostCommentsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSharePostMutation,
  useBookmarkPostMutation,
  useGetBookmarkedPostsQuery,
  useVotePollMutation,
} = postApi;
