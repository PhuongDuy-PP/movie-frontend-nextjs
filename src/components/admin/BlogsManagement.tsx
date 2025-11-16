'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogAPI } from '@/lib/api';
import { Blog } from '@/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiImage, FiEye, FiUpload, FiBold, FiItalic, FiUnderline, FiList, FiLink } from 'react-icons/fi';
import { format } from 'date-fns';
import Image from 'next/image';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';

export default function BlogsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showImageMenu, setShowImageMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    image: '',
    isPublished: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#FF6B35] underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-5',
        'data-placeholder': 'Nhập nội dung blog...',
      },
    },
  });

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['admin', 'blogs'],
    queryFn: () => blogAPI.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => blogAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setShowModal(false);
      resetForm();
      alert('Tạo blog thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo blog');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blogAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setShowModal(false);
      setEditingBlog(null);
      resetForm();
      alert('Cập nhật blog thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật blog');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      alert('Xóa blog thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa blog');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      image: '',
      isPublished: false,
    });
    editor?.commands.setContent('');
    setImagePreview('');
    setEditingBlog(null);
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt || '',
      image: blog.image || '',
      isPublished: blog.isPublished,
    });
    editor?.commands.setContent(blog.content);
    setImagePreview(blog.image || '');
    setShowModal(true);
  };

  // Helper function to compress image - more aggressive compression
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large - more aggressive
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Better image quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Check if compressed size is still too large (> 1MB)
                if (blob.size > 1024 * 1024) {
                  // Further compress with lower quality
                  canvas.toBlob(
                    (smallerBlob) => {
                      if (smallerBlob) {
                        const reader2 = new FileReader();
                        reader2.onloadend = () => {
                          resolve(reader2.result as string);
                        };
                        reader2.onerror = reject;
                        reader2.readAsDataURL(smallerBlob);
                      } else {
                        reject(new Error('Failed to compress image'));
                      }
                    },
                    'image/jpeg',
                    0.6 // Lower quality for large images
                  );
                } else {
                  const reader2 = new FileReader();
                  reader2.onloadend = () => {
                    resolve(reader2.result as string);
                  };
                  reader2.onerror = reject;
                  reader2.readAsDataURL(blob);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }

      // Check file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 10MB');
        return;
      }

      try {
        // Compress image before converting to base64 - more aggressive compression
        const compressedBase64 = await compressImage(file, 1200, 0.7);
        setFormData({ ...formData, image: compressedBase64 });
        setImagePreview(compressedBase64);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
      }
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image: url });
    setImagePreview(url);
  };

  const handleEditorImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        if (editorImageInputRef.current) {
          editorImageInputRef.current.value = '';
        }
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        if (editorImageInputRef.current) {
          editorImageInputRef.current.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        editor?.chain().focus().setImage({ src: base64String }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const handleInsertImage = useCallback(() => {
    setShowImageMenu(!showImageMenu);
  }, [showImageMenu]);

  const handleUploadImage = useCallback(() => {
    setShowImageMenu(false);
    editorImageInputRef.current?.click();
  }, []);

  const handleInsertImageUrl = useCallback(() => {
    setShowImageMenu(false);
    const url = window.prompt('Nhập URL hình ảnh:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false);
      }
    };

    if (showImageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showImageMenu]);

  const handleInsertLink = useCallback(() => {
    const url = window.prompt('Nhập URL liên kết:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = editor?.getHTML() || '';
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung blog');
      return;
    }

    const data = {
      title: formData.title,
      content: content,
      excerpt: formData.excerpt || undefined,
      image: formData.image || undefined,
      isPublished: formData.isPublished,
    };

    if (editingBlog) {
      updateMutation.mutate({ id: editingBlog.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredBlogs = blogs?.filter((blog: Blog) =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!editor) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Quản lý Blog</h2>
        <p className="text-gray-600">Tạo và quản lý các bài viết blog</p>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm blog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg flex items-center gap-2"
          >
            <FiPlus className="text-lg" />
            Thêm blog
          </button>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          </div>
        ) : filteredBlogs && filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog: Blog) => (
            <div key={blog.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              {blog.image && (
                <div className="relative w-full h-48 bg-gray-200">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                {blog.excerpt && (
                  <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{blog.excerpt}</p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  {blog.isPublished ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      Đã xuất bản
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                      Bản nháp
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {blog.views} lượt xem
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-4">
                  <p>Tác giả: {blog.author?.fullName || 'N/A'}</p>
                  <p>Ngày tạo: {format(new Date(blog.createdAt), 'dd/MM/yyyy')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(blog)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiEdit className="text-sm" />
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xóa blog này?')) {
                        deleteMutation.mutate(blog.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-600">Không tìm thấy blog nào</p>
          </div>
        )}
      </div>

      {/* Modal - WordPress Style */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          {/* Header - WordPress Style */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBlog ? 'Chỉnh sửa blog' : 'Thêm blog mới'}
              </h3>
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <FiX className="text-xl text-gray-600" />
            </button>
          </div>

          {/* Main Content - WordPress Style */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Content Area */}
            <form id="blog-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Title - WordPress Style */}
                <div>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-0 py-3 text-3xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder:text-gray-400"
                    placeholder="Nhập tiêu đề blog..."
                  />
                </div>


                {/* Rich Text Editor - WordPress Style */}
                <div>
                  <div className="bg-white border border-gray-300 rounded overflow-hidden focus-within:border-[#FF6B35] focus-within:ring-1 focus-within:ring-[#FF6B35]">
                    {/* Toolbar - WordPress Style */}
                    <div className="bg-white border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-1">
                    {/* Text Formatting */}
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          editor.isActive('bold') ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Bold"
                      >
                        <FiBold className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          editor.isActive('italic') ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Italic"
                      >
                        <FiItalic className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          editor.isActive('underline') ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Underline"
                      >
                        <FiUnderline className="text-sm" />
                      </button>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm font-bold ${
                          editor.isActive('heading', { level: 1 }) ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm font-bold ${
                          editor.isActive('heading', { level: 2 }) ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm font-bold ${
                          editor.isActive('heading', { level: 3 }) ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Heading 3"
                      >
                        H3
                      </button>
                    </div>

                    {/* Lists */}
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          editor.isActive('bulletList') ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Bullet List"
                      >
                        <FiList className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          editor.isActive('orderedList') ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Numbered List"
                      >
                        <FiList className="text-sm rotate-90" />
                      </button>
                    </div>

                    {/* Insert */}
                    <div className="flex items-center gap-1 relative">
                      <input
                        ref={editorImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditorImageUpload}
                        className="hidden"
                      />
                      <div className="relative" ref={imageMenuRef}>
                        <button
                          type="button"
                          onClick={handleInsertImage}
                          className="p-2 rounded hover:bg-gray-200 transition-colors"
                          title="Chèn hình ảnh"
                        >
                          <FiImage className="text-sm" />
                        </button>
                        {showImageMenu && (
                          <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                            <button
                              type="button"
                              onClick={handleUploadImage}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-semibold"
                            >
                              <FiUpload className="text-sm" />
                              Upload từ máy tính
                            </button>
                            <button
                              type="button"
                              onClick={handleInsertImageUrl}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-semibold border-t border-gray-200"
                            >
                              <FiLink className="text-sm" />
                              Nhập URL hình ảnh
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleInsertLink}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                          editor.isActive('link') ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Insert Link"
                      >
                        <FiLink className="text-sm" />
                      </button>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm ${
                          editor.isActive({ textAlign: 'left' }) ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Align Left"
                      >
                        L
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm ${
                          editor.isActive({ textAlign: 'center' }) ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Align Center"
                      >
                        C
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`p-2 rounded hover:bg-gray-200 transition-colors text-sm ${
                          editor.isActive({ textAlign: 'right' }) ? 'bg-[#FF6B35] text-white' : ''
                        }`}
                        title="Align Right"
                      >
                        R
                      </button>
                    </div>
                  </div>

                    {/* Editor Content - WordPress Style */}
                    <div className="min-h-[500px]">
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>

                {/* Excerpt - WordPress Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tóm tắt</label>
                  <textarea
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] bg-white"
                    placeholder="Nhập tóm tắt blog (sẽ hiển thị ở trang danh sách)..."
                  />
                </div>

                {/* Image Upload - WordPress Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hình ảnh nổi bật</label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden border border-gray-300">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-semibold"
                      >
                        <FiUpload className="inline mr-2" />
                        Chọn hình ảnh
                      </button>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, image: '' });
                            setImagePreview('');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded hover:bg-red-100 transition-colors text-sm font-semibold"
                        >
                          <FiX className="inline mr-2" />
                          Xóa hình ảnh
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={formData.image && !imagePreview ? formData.image : ''}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="Hoặc nhập URL hình ảnh"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#FF6B35] focus:border-[#FF6B35] bg-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Right Sidebar - WordPress Style */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Publish Box */}
                <div className="border border-gray-300 rounded">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-300">
                    <h4 className="font-semibold text-gray-900">Xuất bản</h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublished}
                          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                          className="w-4 h-4 text-[#FF6B35] rounded focus:ring-2 focus:ring-[#FF6B35]"
                        />
                        <span className="text-sm font-medium text-gray-700">Xuất bản ngay</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Nếu không chọn, blog sẽ được lưu dưới dạng bản nháp
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        form="blog-form"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubmit(e as any);
                        }}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="w-full px-4 py-2 bg-[#FF6B35] text-white rounded font-semibold hover:bg-[#E55A2B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FiCheck className="text-sm" />
                        {editingBlog ? 'Cập nhật' : 'Xuất bản'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
