'use client';

import { useQuery } from '@tanstack/react-query';
import { blogAPI } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiEye } from 'react-icons/fi';

export default function BlogPage() {
  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => blogAPI.getAll(true).then((res) => res.data),
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-4xl font-black mb-8 text-center">Tin tức & Blog</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 animate-pulse h-64 rounded w-full max-w-sm" />
          ))}
        </div>
      ) : blogs && blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {blogs.map((blog: any) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.id}`}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all w-full max-w-sm group"
            >
              {blog.image && (
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 line-clamp-2">{blog.title}</h3>
                {blog.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{blog.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <FiUser />
                    <span>{blog.author?.fullName}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <FiCalendar />
                      <span>{format(new Date(blog.createdAt), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiEye />
                      <span>{blog.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Chưa có bài viết nào</p>
        </div>
      )}
    </div>
  );
}

