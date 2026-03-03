import { apiSlice } from './api';
import { Post, PaginatedResponse, ApiResponse } from '@types';

interface CreatePostData {
  content: string;
  media?: File[];
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
    media: normalizedMedia,
    mediaUrls: raw?.mediaUrls || [],
    likes: Array.isArray(raw?.likes) ? raw.likes : Number(raw?.likes || 0),
    comments: Array.isArray(raw?.comments) ? raw.comments : Number(raw?.comments || 0),
    shares: Number(raw?.shares || 0),
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
      providesTags: ['Post'],
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
      invalidatesTags: ['Post'],
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
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
    deletePost: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Post'],
    }),
    likePost: builder.mutation<ApiResponse<Post>, string>({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    unlikePost: builder.mutation<ApiResponse<Post>, string>({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    addComment: builder.mutation<ApiResponse<Post>, { postId: string; content: string }>({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Post', id: postId }, 'Post'],
    }),
    deleteComment: builder.mutation<ApiResponse<Post>, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `/posts/${postId}/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { postId }) => [{ type: 'Post', id: postId }, 'Post'],
    }),
    sharePost: builder.mutation<ApiResponse<Post>, string>({
      query: (id) => ({
        url: `/posts/${id}/share`,
        method: 'POST',
      }),
      invalidatesTags: ['Post'],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetUserPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSharePostMutation,
} = postApi;
