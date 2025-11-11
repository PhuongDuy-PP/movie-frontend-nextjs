'use client';

import { useQuery } from '@tanstack/react-query';
import { blogAPI } from '@/lib/api';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiEye } from 'react-icons/fi';

export default function BlogDetailPage() {
  const params = useParams();
  const blogId = params.id as string;

  const { data: blog, isLoading } = useQuery({
    queryKey: ['blog', blogId],
    queryFn: () => blogAPI.getById(blogId).then((res) => res.data),
    enabled: !!blogId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl">Bài viết không tồn tại</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
          <div className="flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-2">
              <FiUser />
              <span>{blog.author?.fullName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCalendar />
              <span>{format(new Date(blog.createdAt), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiEye />
              <span>{blog.views} lượt xem</span>
            </div>
          </div>
        </div>

        {/* Image */}
        {blog.image && (
          <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Excerpt */}
        {blog.excerpt && (
          <div className="bg-gray-100 border-l-4 border-red-600 p-4 mb-8">
            <p className="text-lg italic text-gray-700">{blog.excerpt}</p>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>
    </div>
  );
}

